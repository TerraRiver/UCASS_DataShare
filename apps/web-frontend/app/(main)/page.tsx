'use client'

import { Link } from "@nextui-org/link";
import DefaultLayout from "@/layouts/default";
import { Button, Card, CardBody } from "@nextui-org/react";
import { BookCopy, FileUp, Layers3, Database, Share2, Lock, BarChart3, Network } from "lucide-react";

export default function Home() {
	return (
		<DefaultLayout>
			{/* Hero Section - Minimalist Design */}
			<section className="flex flex-col items-center justify-center min-h-[85vh] px-8">
				<div className="max-w-5xl text-center space-y-16">
					{/* Title with Serif Font */}
					<div className="space-y-6">
						<h1
							className="text-5xl md:text-7xl font-light tracking-wide"
							style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
						>
							<span className="text-red-600">计算社会科学</span>
							<br />
							<span className="text-gray-900">与国家治理实验室</span>
						</h1>
						<div className="h-1 w-32 bg-red-600 mx-auto"></div>
						<p
							className="text-2xl md:text-3xl font-light text-gray-700 mt-8"
							style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
						>
							学术资源共享交流平台
						</p>
					</div>

					{/* Four Main Navigation Cards */}
					<div className="flex flex-wrap justify-center gap-6 w-full max-w-7xl mt-20 mx-auto">
						<Card
							as={Link}
							href={'/discover'}
							className="w-52 h-52 bg-white border-2 border-red-100 hover:border-red-300 transition-all duration-500 hover:shadow-2xl hover:scale-105 cursor-pointer group"
							isPressable
						>
							<CardBody className="flex flex-col items-center justify-center p-8 text-center gap-4">
								<div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
									<Layers3 size={32} className="text-red-600" />
								</div>
								<div className="space-y-2">
									<h3
										className="text-xl font-medium text-gray-800"
										style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
									>
										浏览数据集
									</h3>
									<p className="text-gray-600 text-xs">
										探索和发现丰富的学术数据资源
									</p>
								</div>
							</CardBody>
						</Card>

						<Card
							as={Link}
							href={'/casestudies'}
							className="w-52 h-52 bg-white border-2 border-red-100 hover:border-red-300 transition-all duration-500 hover:shadow-2xl hover:scale-105 cursor-pointer group"
							isPressable
						>
							<CardBody className="flex flex-col items-center justify-center p-8 text-center gap-4">
								<div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
									<BookCopy size={32} className="text-red-600" />
								</div>
								<div className="space-y-2">
									<h3
										className="text-xl font-medium text-gray-800"
										style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
									>
										浏览案例集
									</h3>
									<p className="text-gray-600 text-xs">
										学习优秀的研究案例和方法
									</p>
								</div>
							</CardBody>
						</Card>

						<Card
							as={Link}
							href={'/upload'}
							className="w-52 h-52 bg-red-50 border-2 border-red-200 hover:border-red-400 transition-all duration-500 hover:shadow-2xl hover:scale-105 cursor-pointer group"
							isPressable
						>
							<CardBody className="flex flex-col items-center justify-center p-8 text-center gap-4">
								<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
									<FileUp size={32} className="text-red-700" />
								</div>
								<div className="space-y-2">
									<h3
										className="text-xl font-medium text-red-800"
										style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
									>
										上传数据集
									</h3>
									<p className="text-red-600 text-xs">
										分享您的学术数据资源
									</p>
								</div>
							</CardBody>
						</Card>

						<Card
							as={Link}
							href={'/upload-casestudy'}
							className="w-52 h-52 bg-red-50 border-2 border-red-200 hover:border-red-400 transition-all duration-500 hover:shadow-2xl hover:scale-105 cursor-pointer group"
							isPressable
						>
							<CardBody className="flex flex-col items-center justify-center p-8 text-center gap-4">
								<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center group-hover:bg-red-200 transition-colors">
									<FileUp size={32} className="text-red-700" />
								</div>
								<div className="space-y-2">
									<h3
										className="text-xl font-medium text-red-800"
										style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
									>
										上传案例集
									</h3>
									<p className="text-red-600 text-xs">
										分享您的研究经验和成果
									</p>
								</div>
							</CardBody>
						</Card>

					<Card
						as={Link}
						href={'/explore'}
						className="w-52 h-52 bg-white border-2 border-red-100 hover:border-red-300 transition-all duration-500 hover:shadow-2xl hover:scale-105 cursor-pointer group"
						isPressable
					>
						<CardBody className="flex flex-col items-center justify-center p-8 text-center gap-4">
							<div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center group-hover:bg-red-100 transition-colors">
								<Network size={32} className="text-red-600" />
							</div>
							<div className="space-y-2">
								<h3
									className="text-xl font-medium text-gray-800"
									style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
								>
									知识图谱探索
								</h3>
								<p className="text-gray-600 text-xs">
									探索数据集与案例集的关联关系
								</p>
							</div>
						</CardBody>
					</Card>
					</div>
				</div>
			</section>

			{/* Platform Features Section */}
			<section className="py-32 px-8">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-24">
						<h2
							className="text-4xl md:text-5xl font-light text-gray-900 mb-8"
							style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
						>
							平台功能特色
						</h2>
						<div className="h-1 w-20 bg-red-600 mx-auto"></div>
						<p className="text-xl text-gray-600 mt-8 max-w-3xl mx-auto">
							专为人文社会科学研究设计，提供安全、高效、专业的数据共享与管理服务
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
						<div className="text-center space-y-6">
							<div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
								<Database size={32} className="text-red-600" />
							</div>
							<div className="space-y-3">
								<h3
									className="text-2xl font-medium text-gray-900"
									style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
								>
									规范数据管理
								</h3>
								<p className="text-gray-600 leading-relaxed">
									专业的数据分类、标签和元数据管理，确保学术数据的规范性和可检索性
								</p>
							</div>
						</div>

						<div className="text-center space-y-6">
							<div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
								<Share2 size={32} className="text-red-600" />
							</div>
							<div className="space-y-3">
								<h3
									className="text-2xl font-medium text-gray-900"
									style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
								>
									安全共享机制
								</h3>
								<p className="text-gray-600 leading-relaxed">
									多层次的权限控制和访问管理，保护知识产权的同时促进学术交流
								</p>
							</div>
						</div>

						<div className="text-center space-y-6">
							<div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
								<Lock size={32} className="text-red-600" />
							</div>
							<div className="space-y-3">
								<h3
									className="text-2xl font-medium text-gray-900"
									style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
								>
									隐私保护
								</h3>
								<p className="text-gray-600 leading-relaxed">
									严格的隐私保护措施和数据加密，确保敏感信息的安全存储与使用
								</p>
							</div>
						</div>

						<div className="text-center space-y-6">
							<div className="w-16 h-16 mx-auto bg-red-50 rounded-full flex items-center justify-center">
								<BarChart3 size={32} className="text-red-600" />
							</div>
							<div className="space-y-3">
								<h3
									className="text-2xl font-medium text-gray-900"
									style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
								>
									数据分析工具
								</h3>
								<p className="text-gray-600 leading-relaxed">
									内置数据分析工具和可视化功能，支持多样化的研究方法和需求
								</p>
							</div>
						</div>
					</div>

					<div className="mt-24 text-center">
						<div className="inline-block">
							<h3
								className="text-3xl font-light text-gray-900 mb-4"
								style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
							>
								开始您的数据共享之旅
							</h3>
							<Button
								as={Link}
								href={'/discover'}
								className="bg-red-600 text-white px-8 py-4 text-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl"
								style={{ fontFamily: "var(--font-noto-serif-sc, 'Noto Serif SC', Georgia, serif)" }}
							>
								立即开始探索
							</Button>
						</div>
					</div>
				</div>
			</section>
		</DefaultLayout>
	);
} 