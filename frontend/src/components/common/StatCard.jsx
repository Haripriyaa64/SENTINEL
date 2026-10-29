import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export default function StatCard({
  title,
  value = "—",
  detail,
  icon: Icon,
  color = "cyan",
  trend,
  delay = 0,
}) {
  const negative = String(trend ?? "").startsWith("-");

  return (
    <motion.article
      className={`stat-card glass-panel stat-${color}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
    >
      <div className="stat-card__top">
        <span className="stat-card__label">{title}</span>

        {Icon && (
          <span className="stat-card__icon">
            <Icon size={19} strokeWidth={1.8} />
          </span>
        )}
      </div>

      <div className="stat-card__value">{value}</div>

      <div className="stat-card__bottom">
        <span className="stat-card__detail">{detail}</span>

        {trend != null && (
          <span className={`stat-trend ${negative ? "negative" : "positive"}`}>
            {negative ? (
              <ArrowDownRight size={14} />
            ) : (
              <ArrowUpRight size={14} />
            )}
            {trend}
          </span>
        )}
      </div>

      <span className="stat-card__glow" aria-hidden="true" />
    </motion.article>
  );
}