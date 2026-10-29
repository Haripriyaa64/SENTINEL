import { motion } from "framer-motion";

export default function PageHeader({
  eyebrow = "SECURITY OPERATIONS CENTER",
  title,
  accent,
  description,
  actions,
}) {
  return (
    <motion.section
      className="page-title-row"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div>
        <div className="eyebrow page-eyebrow">
          <span className="eyebrow-line" />
          {eyebrow}
        </div>

        <h1>
          {title} {accent && <span>{accent}</span>}
        </h1>

        {description && <p>{description}</p>}
      </div>

      {actions && <div className="title-actions">{actions}</div>}
    </motion.section>
  );
}