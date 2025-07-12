export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Jaxen's Pens",
  description: "A collection of my stories and poems.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Pieces",
      href: "/pieces",
    },
    {
      label: "Poems",
      href: "/poems",
    },
    {
      label: "About",
      href: "/about",
    },
  ],
  links: {
    github: "https://github.com/jaxendutta",
    discord: "https://discord.com/users/jamnoose",
    email: "mailto:jaxendutta@gmail.com",
    portfolio: "https://anirban.ca",
  },
};
