'use client'

import { Link } from "@nextui-org/link";
import { button as buttonStyles } from "@nextui-org/theme";
import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import {Card, CardHeader, CardBody, CardFooter, Image, Button} from "@nextui-org/react";
import { 
	ArrowRight, BookCopy, FileUp, Layers3, 
	Landmark, TestTube2, BookHeart, LandmarkIcon, Globe, Mic, Cpu, Sigma
} from "lucide-react";
import { Snippet } from "@nextui-org/snippet";
import { Code } from "@nextui-org/code";
import { GithubIcon } from "@/components/icons";

const categories = [
	{ name: '政治学', icon: <Landmark size={32} className="text-blue-500"/>, color: "blue" },
	{ name: '经济学', icon: <TestTube2 size={32} className="text-green-500"/>, color: "green" },
	{ name: '社会学', icon: <BookHeart size={32} className="text-red-500"/>, color: "red" },
	{ name: '传统与现代文化', icon: <LandmarkIcon size={32} className="text-yellow-500"/>, color: "yellow" },
	{ name: '法学', icon: <Globe size={32} className="text-purple-500"/>, color: "purple" },
	{ name: '新闻传播', icon: <Mic size={32} className="text-pink-500"/>, color: "pink" },
	{ name: '计算科学', icon: <Cpu size={32} className="text-gray-500"/>, color: "default" },
	{ name: '数学', icon: <Sigma size={32} className="text-orange-500"/>, color: "orange" },
]

export default function Home() {
	return (
		<DefaultLayout>
			{/* Hero Section */}
			<section className="flex flex-col items-center justify-center gap-4 py-12 md:py-20">
				<div className="max-w-4xl text-center">
					<h1 className={title({ color: "red", class: "whitespace-nowrap" })}>
						计算社会科学与国家治理实验室
					</h1>
					<br />
					<h1 className={title({ class: "mt-4" })}>
						XX数据集共享交流平台
					</h1>
				</div>

				<div className="flex gap-3">
					<Button
						as={Link}
						href={'/discover'}
						color="primary"
						variant="solid"
						size="lg"
						className="px-8 py-4 text-lg"
					>
						浏览数据集
					</Button>
					<Button
						as={Link}
						href={'/upload'}
						color="primary"
						variant="ghost"
						size="lg"
						className="px-8 py-4 text-lg"
					>
						上传数据集
					</Button>
					<Button
						as={Link}
						href={'/upload-casestudy'}
						color="secondary"
						variant="solid"
						size="lg"
						className="px-8 py-4 text-lg"
					>
						上传案例集
					</Button>
				</div>
			</section>



			{/* Category Navigation Section */}
			<section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<h2 className="text-3xl font-extrabold text-gray-900 text-center mb-12">
					分类导航
				</h2>
				<div className="grid grid-cols-2 md:grid-cols-4 auto-rows-fr gap-4">
					{categories.map((category, index) => {
						let cardClass = "flex flex-col items-center justify-center p-6 text-center transform hover:scale-105 transition-transform duration-300 ease-in-out shadow-lg rounded-lg";
						
						// Apply special styling for specific cards to create an irregular layout
						if (index === 0) {
							cardClass += " md:col-span-2 md:row-span-2";
						} else if (index === 5) {
							cardClass += " md:col-span-2";
						}

						return (
							<Card 
								as={Link}
								href={`/discover?catalog=${encodeURIComponent(category.name)}`}
								isPressable 
								key={index} 
								className={cardClass}
							>
								<div className="mb-4">
									{category.icon}
								</div>
								<h3 className="text-xl font-semibold text-gray-800">{category.name}</h3>
							</Card>
						);
					})}
				</div>
			</section>

		</DefaultLayout>
	);
} 