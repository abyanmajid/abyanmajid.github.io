type NavItem = {
  href: string;
  label: string;
};

const navItems: NavItem[] = [
  {
    label: "Tasks",
    href: "tasks",
  },
  {
    label: "Timer",
    href: "timer",
  },
  {
    label: "Analytics",
    href: "analytics",
  },
  {
    label: "History",
    href: "history",
  },
  {
    label: "Settings",
    href: "settings",
  },
];

function Navbar() {
  return (
    <nav className="px-12 bg-[#0E1118]">
      <ul>
        <li>
          <a className="text-xl contrast" href="/">
            <strong>Lock In ✨</strong>
          </a>
        </li>
      </ul>
      <ul>
        {navItems.map((item) => (
          <li>
            <a href={`/dash/${item.href}`} className="contrast">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default Navbar;
