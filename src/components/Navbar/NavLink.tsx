import { Link } from 'wouter';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

export function NavLink({ href, children, active = false }: NavLinkProps) {
  return (
    <Link href={href}>
      <a
        className={`text-sm transition-colors ${
          active
            ? 'text-white'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        {children}
      </a>
    </Link>
  );
}
