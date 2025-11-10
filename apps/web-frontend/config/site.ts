export type SiteConfig = typeof siteConfig;

export const siteConfig = {
	name: "UCASS DataShare",
	description: "为人文社科研究打造的安全数据共享平台",
	navItems: [
		{
			label: "首页",
			href: "/",
		},
    {
      label: "浏览所有数据集",
      href: "/discover",
    },
    {
      label: "浏览所有案例集",
      href: "/casestudies",
    },
    {
      label: "AI 智能助手",
      href: "/ai-assistant",
    },
    {
      label: "上传数据集",
      href: "/upload",
    },
    {
      label: "上传案例集",
      href: "/upload-casestudy",
    }
 ],
 navMenuItems: [
  {
   label: "浏览所有数据集",
			href: "/discover",
		},
			 {
			   label: "浏览所有案例集",
			   href: "/casestudies",
			 },
		{
			label: "AI 智能助手",
			href: "/ai-assistant",
		},
		{
			label: "上传数据集",
			href: "/upload",
		},
			 {
			   label: "上传案例集",
			   href: "/upload-casestudy",
			 },
		{
			label: "管理后台",
			href: "/admin/login",
		},
	],
	links: {
		github: "https://github.com/your-repo",
    docs: "/docs"
	},
}; 