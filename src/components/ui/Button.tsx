import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

type CommonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  icon?: ReactNode;
  size?: "md" | "lg";
};

function useMotionProps() {
  const reducedMotion = useReducedMotion();
  return reducedMotion
    ? {}
    : {
        whileTap: { scale: 0.98 },
        transition: { duration: 0.18 },
      };
}

function Content({ children, icon }: Pick<CommonProps, "children" | "icon">) {
  return (
    <>
      <span className="dashboard-button__label">
        {icon}
        {children}
      </span>
      <ArrowUpRight aria-hidden="true" />
    </>
  );
}

function ButtonBase({
  tone,
  children,
  className = "",
  href,
  external = true,
  onClick,
  ariaLabel,
  icon,
  size = "lg",
}: CommonProps & { tone: "primary" | "outline" }) {
  const motionProps = useMotionProps();
  const classes = `dashboard-button dashboard-button--${tone} dashboard-button--${size} ${className}`;
  const content = <Content icon={icon}>{children}</Content>;

  if (href) {
    return (
      <motion.a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...motionProps}
      >
        {content}
      </motion.a>
    );
  }

  return (
    <motion.button
      type="button"
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
      {...motionProps}
    >
      {content}
    </motion.button>
  );
}

export function PrimaryButton(props: CommonProps) {
  return <ButtonBase tone="primary" {...props} />;
}

export function OutlineButton(props: CommonProps) {
  return <ButtonBase tone="outline" {...props} />;
}
