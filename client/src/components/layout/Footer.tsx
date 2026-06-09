const Footer: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      className="relative z-10 border-t border-slate-200/70 bg-white/70 backdrop-blur-sm px-4 py-3 text-center text-xs text-slate-600"
      data-testid="app-footer"
    >
      Part of the{" "}
      <a
        href="https://www.smarthinkerz.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
        data-testid="link-smarthinkerz"
      >
        SmarThinkerz Unified Intelligence Hub
      </a>
    </footer>
  );
};

export default Footer;
