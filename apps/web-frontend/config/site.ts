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
      label: "数据发现",
      href: "/discover",
    },
    {
      label: "数据上传",
      href: "/upload",
    }
	],
	navMenuItems: [
		{
			label: "数据发现",
			href: "/discover",
		},
		{
			label: "数据上传",
			href: "/upload",
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