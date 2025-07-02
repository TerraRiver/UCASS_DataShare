from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.utils import PlotlyJSONEncoder
import json
import os
import logging
from pathlib import Path

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="UCASS DataShare Python Service",
    description="数据预览、可视化和分析服务",
    version="1.0.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 设置中文字体（用于matplotlib）
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# 请求模型
class PreviewRequest(BaseModel):
    file_path: str
    file_type: str
    rows: Optional[int] = 100

class VisualizeRequest(BaseModel):
    file_path: str
    file_type: str
    chart_type: str  # histogram, scatter, line, bar, box, heatmap
    x_column: Optional[str] = None
    y_column: Optional[str] = None
    color_column: Optional[str] = None
    title: Optional[str] = None

class AnalyzeRequest(BaseModel):
    file_path: str
    file_type: str
    analysis_type: str  # describe, correlation, missing_values

# 工具函数
def load_data_file(file_path: str, file_type: str) -> pd.DataFrame:
    """加载数据文件"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="文件不存在")
    
    try:
        if file_type == 'csv':
            # 尝试不同的编码
            for encoding in ['utf-8', 'gbk', 'gb2312']:
                try:
                    return pd.read_csv(file_path, encoding=encoding)
                except UnicodeDecodeError:
                    continue
            # 如果都失败了，使用utf-8并忽略错误
            return pd.read_csv(file_path, encoding='utf-8', errors='ignore')
        
        elif file_type in ['xlsx', 'xls']:
            return pd.read_excel(file_path)
        
        elif file_type == 'json':
            return pd.read_json(file_path)
        
        elif file_type == 'txt':
            # 假设是制表符分隔的文件
            return pd.read_csv(file_path, sep='\t', encoding='utf-8', errors='ignore')
        
        else:
            raise HTTPException(status_code=400, detail=f"不支持的文件类型: {file_type}")
    
    except Exception as e:
        logger.error(f"加载文件失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"文件加载失败: {str(e)}")

def prepare_data_for_json(data: Any) -> Any:
    """准备数据用于JSON序列化"""
    if isinstance(data, np.ndarray):
        return data.tolist()
    elif isinstance(data, (np.int64, np.int32)):
        return int(data)
    elif isinstance(data, (np.float64, np.float32)):
        return float(data)
    elif isinstance(data, np.bool_):
        return bool(data)
    elif isinstance(data, pd.Timestamp):
        return data.isoformat()
    elif pd.isna(data):
        return None
    return data

@app.get("/")
async def root():
    return {
        "service": "UCASS DataShare Python Service",
        "status": "running",
        "version": "1.0.0"
    }

@app.post("/preview")
async def preview_data(request: PreviewRequest):
    """数据预览接口"""
    try:
        df = load_data_file(request.file_path, request.file_type)
        
        # 限制预览行数
        preview_rows = min(request.rows, len(df))
        preview_df = df.head(preview_rows)
        
        # 准备返回数据
        columns = df.columns.tolist()
        data = []
        
        for _, row in preview_df.iterrows():
            row_data = {}
            for col in columns:
                row_data[col] = prepare_data_for_json(row[col])
            data.append(row_data)
        
        # 数据类型信息
        dtypes = {}
        for col in columns:
            dtypes[col] = str(df[col].dtype)
        
        return {
            "columns": columns,
            "data": data,
            "total_rows": len(df),
            "preview_rows": preview_rows,
            "dtypes": dtypes,
            "shape": list(df.shape)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"数据预览失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"数据预览失败: {str(e)}")

@app.post("/visualize")
async def visualize_data(request: VisualizeRequest):
    """数据可视化接口"""
    try:
        df = load_data_file(request.file_path, request.file_type)
        
        # 检查数据是否为空
        if df.empty:
            raise HTTPException(status_code=400, detail="数据集为空")
        
        fig = None
        chart_title = request.title or f"{request.chart_type.title()} Chart"
        
        if request.chart_type == "histogram":
            if not request.x_column:
                # 选择第一个数值列
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) == 0:
                    raise HTTPException(status_code=400, detail="没有数值列可用于直方图")
                request.x_column = numeric_cols[0]
            
            fig = px.histogram(df, x=request.x_column, title=chart_title)
        
        elif request.chart_type == "scatter":
            if not request.x_column or not request.y_column:
                numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
                if len(numeric_cols) < 2:
                    raise HTTPException(status_code=400, detail="散点图需要至少两个数值列")
                request.x_column = request.x_column or numeric_cols[0]
                request.y_column = request.y_column or numeric_cols[1]
            
            fig = px.scatter(
                df, x=request.x_column, y=request.y_column, 
                color=request.color_column, title=chart_title
            )
        
        elif request.chart_type == "line":
            if not request.x_column or not request.y_column:
                raise HTTPException(status_code=400, detail="折线图需要指定X和Y列")
            
            fig = px.line(
                df, x=request.x_column, y=request.y_column,
                color=request.color_column, title=chart_title
            )
        
        elif request.chart_type == "bar":
            if not request.x_column:
                # 选择第一个分类列或者对数值列进行分组
                categorical_cols = df.select_dtypes(include=['object', 'category']).columns
                if len(categorical_cols) > 0:
                    request.x_column = categorical_cols[0]
                else:
                    raise HTTPException(status_code=400, detail="没有合适的列用于柱状图")
            
            if request.y_column:
                fig = px.bar(df, x=request.x_column, y=request.y_column, title=chart_title)
            else:
                # 计算频次
                value_counts = df[request.x_column].value_counts().head(20)
                fig = px.bar(x=value_counts.index, y=value_counts.values, title=chart_title)
        
        elif request.chart_type == "box":
            if not request.y_column:
                numeric_cols = df.select_dtypes(include=[np.number]).columns
                if len(numeric_cols) == 0:
                    raise HTTPException(status_code=400, detail="没有数值列可用于箱线图")
                request.y_column = numeric_cols[0]
            
            fig = px.box(df, x=request.x_column, y=request.y_column, title=chart_title)
        
        elif request.chart_type == "heatmap":
            # 计算数值列的相关矩阵
            numeric_df = df.select_dtypes(include=[np.number])
            if numeric_df.empty:
                raise HTTPException(status_code=400, detail="没有数值列可用于热力图")
            
            corr_matrix = numeric_df.corr()
            fig = px.imshow(
                corr_matrix, 
                text_auto=True, 
                aspect="auto",
                title="相关性热力图"
            )
        
        else:
            raise HTTPException(status_code=400, detail=f"不支持的图表类型: {request.chart_type}")
        
        if fig is None:
            raise HTTPException(status_code=500, detail="图表生成失败")
        
        # 转换为JSON格式
        chart_json = json.loads(fig.to_json())
        
        return {
            "chart": chart_json,
            "metadata": {
                "chart_type": request.chart_type,
                "x_column": request.x_column,
                "y_column": request.y_column,
                "color_column": request.color_column,
                "data_shape": list(df.shape)
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"数据可视化失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"数据可视化失败: {str(e)}")

@app.post("/analyze")
async def analyze_data(request: AnalyzeRequest):
    """数据分析接口"""
    try:
        df = load_data_file(request.file_path, request.file_type)
        
        if df.empty:
            raise HTTPException(status_code=400, detail="数据集为空")
        
        if request.analysis_type == "describe":
            # 描述性统计
            numeric_df = df.select_dtypes(include=[np.number])
            
            if numeric_df.empty:
                raise HTTPException(status_code=400, detail="没有数值列可进行描述性分析")
            
            description = numeric_df.describe()
            
            # 转换为可序列化的格式
            result = {}
            for col in description.columns:
                result[col] = {}
                for stat in description.index:
                    result[col][stat] = prepare_data_for_json(description.loc[stat, col])
            
            return {
                "analysis_type": "describe",
                "result": result,
                "columns": numeric_df.columns.tolist(),
                "shape": list(df.shape)
            }
        
        elif request.analysis_type == "correlation":
            # 相关性分析
            numeric_df = df.select_dtypes(include=[np.number])
            
            if numeric_df.empty or len(numeric_df.columns) < 2:
                raise HTTPException(status_code=400, detail="相关性分析需要至少两个数值列")
            
            correlation_matrix = numeric_df.corr()
            
            # 转换为可序列化的格式
            corr_dict = {}
            for col1 in correlation_matrix.columns:
                corr_dict[col1] = {}
                for col2 in correlation_matrix.columns:
                    corr_dict[col1][col2] = prepare_data_for_json(correlation_matrix.loc[col1, col2])
            
            return {
                "analysis_type": "correlation",
                "result": corr_dict,
                "columns": numeric_df.columns.tolist(),
                "shape": list(df.shape)
            }
        
        elif request.analysis_type == "missing_values":
            # 缺失值分析
            missing_counts = df.isnull().sum()
            missing_percentages = (df.isnull().sum() / len(df)) * 100
            
            result = {}
            for col in df.columns:
                result[col] = {
                    "missing_count": prepare_data_for_json(missing_counts[col]),
                    "missing_percentage": prepare_data_for_json(missing_percentages[col]),
                    "total_rows": len(df)
                }
            
            return {
                "analysis_type": "missing_values",
                "result": result,
                "columns": df.columns.tolist(),
                "shape": list(df.shape),
                "total_missing": prepare_data_for_json(df.isnull().sum().sum())
            }
        
        else:
            raise HTTPException(status_code=400, detail=f"不支持的分析类型: {request.analysis_type}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"数据分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"数据分析失败: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 