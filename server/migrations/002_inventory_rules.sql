ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS low_stock_threshold INT NOT NULL DEFAULT 10;

CREATE TABLE IF NOT EXISTS inventory_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  change_amount INT NOT NULL,
  reason ENUM('restock','distribution') NOT NULL,
  changed_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES inventory_items(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
