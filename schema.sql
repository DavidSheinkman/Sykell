CREATE TABLE IF NOT EXISTS urls (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url VARCHAR(2048) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status ENUM('queued', 'running', 'done', 'error') DEFAULT 'queued',
  last_run_at DATETIME
);

CREATE TABLE IF NOT EXISTS crawl_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url_id INT NOT NULL,
  html_version VARCHAR(50),
  title TEXT,
  h1_count INT,
  h2_count INT,
  internal_links INT,
  external_links INT,
  broken_links INT,
  has_login_form BOOLEAN,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (url_id) REFERENCES urls(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS broken_link_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  crawl_result_id INT NOT NULL,
  url TEXT NOT NULL,
  status_code INT NOT NULL,
  FOREIGN KEY (crawl_result_id) REFERENCES crawl_results(id) ON DELETE CASCADE
);