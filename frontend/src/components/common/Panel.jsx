import { motion } from "framer-motion";

export default function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
  delay = 0,
}) {
  return (
    <motion.section
      className={`glass-panel panel ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      {(title || eyebrow || action) && (
        <div className="panel-heading">
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h3>{title}</h3>}
          </div>

          {action && (
            <div className="panel-heading__action">{action}</div>
          )}
        </div>
      )}

      <div className="panel-body">{children}</div>
    </motion.section>
  );
}