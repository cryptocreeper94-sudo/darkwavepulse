export default function CategoryPills({ categories, activeCategory, onSelect }) {
  return (
    <div className="category-pills">
      {categories.map(cat => (
        <button
          key={cat.id}
          className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.icon && <span>{cat.icon}</span>}
          {cat.label}
        </button>
      ))}
    </div>
  )
}
