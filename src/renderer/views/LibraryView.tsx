import React from "react";
import { useTranslation } from "react-i18next";

function LibraryView() {
  const { t } = useTranslation();
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadLibraryItems();
  }, []);

  const loadLibraryItems = async () => {
    try {
      const libraryItems = await window.electronAPI.library.getItems();
      setItems(libraryItems || []);
    } catch (err) {
      console.error("Failed to load library:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="view library-view">
      <h2>{t("library.title")}</h2>
      
      {loading ? (
        <p>{t("discovery.loading")}</p>
      ) : items.length > 0 ? (
        <div className="library-grid" role="region" aria-label="Library content">
          {items.map((item) => (
            <div key={item.id} className="library-card">
              <h3>{item.title}</h3>
              <button className="btn-primary" aria-label={`Play ${item.title}`}>
                {t("player.play")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>{t("library.empty")}</p>
          <p>{t("library.addContent")}</p>
        </div>
      )}
    </div>
  );
}

export default LibraryView;
