import React, { useEffect, useMemo, useState } from 'react';
import { Container, Spinner } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import EmptyState from '../components/ui/EmptyState';
import { fetchFoods, fetchTypes, fetchVariants } from '../services/api';
import styles from './MenuPage.module.css';
import ChatShortcut from '../components/ChatShortcut/ChatShortcut';

const MenuPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pizzas, setPizzas] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [query, setQuery] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [sort, setSort] = useState('default');
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setError(''); // Clear previous errors
        const [foodsData, typesData, variantsData] = await Promise.all([
          fetchFoods(),
          fetchTypes(),
          fetchVariants()
        ]);
        if (mounted) {
          // Join variants into foods as BienTheMonAn array
          const foods = Array.isArray(foodsData) ? foodsData : [];
          const variants = Array.isArray(variantsData) ? variantsData : [];
          
          const enrichedFoods = foods.map(food => {
            const foodVariants = variants.filter(v => v.MonAn?.MaMonAn === food.MaMonAn);
            return {
              ...food,
              BienTheMonAn: foodVariants
            };
          });
          
          setPizzas(enrichedFoods);
          setTypes(Array.isArray(typesData) ? typesData : []);
          // Auto select first type
          if (typesData && typesData.length > 0) {
            setSelectedType(String(typesData[0].MaLoaiMonAn));
          }
        }
      } catch (e) {
        if (mounted) {
          console.error('Menu load error:', e);
          setError('Đang tải dữ liệu từ server... Vui lòng đợi trong giây lát.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const categoryParam = params.get('category');
  const typeParam = params.get('type');

  // Available categories based on selected type
  const availableCategories = useMemo(() => {
    if (!selectedType) return [];
    const foodsOfType = pizzas.filter(p => String(p.MaLoaiMonAn) === String(selectedType));
    const categoryMap = new Map();
    foodsOfType.forEach(food => {
      if (Array.isArray(food.DanhMuc)) {
        food.DanhMuc.forEach(cat => {
          if (!categoryMap.has(cat.MaDanhMuc)) {
            categoryMap.set(cat.MaDanhMuc, cat);
          }
        });
      }
    });
    return Array.from(categoryMap.values());
  }, [pizzas, selectedType]);

  // Sync selected type with ?type param
  useEffect(() => {
    if (!types || types.length === 0) return;
    if (typeParam) {
      const exists = types.some(t => String(t.MaLoaiMonAn) === String(typeParam));
      if (exists && String(selectedType) !== String(typeParam)) {
        setSelectedType(String(typeParam));
        setSelectedCategory(null);
      }
    }
  }, [types, typeParam]);

  // Filtering
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pizzas.filter(p => {
      const nameOk = p.TenMonAn?.toLowerCase().includes(q);
      if (q.length > 0) return nameOk; // global search ignores type/category
      const typeOk = selectedType ? String(p.MaLoaiMonAn) === String(selectedType) : true;
      const categoryOk = selectedCategory
        ? Array.isArray(p.DanhMuc) && p.DanhMuc.some(dm => dm.MaDanhMuc === selectedCategory)
        : true;
      return nameOk && typeOk && categoryOk;
    });
  }, [pizzas, query, selectedType, selectedCategory]);

  const hasQuery = query.trim().length > 0;
  const currentTypeName = hasQuery
    ? 'Kết quả tìm kiếm'
    : (types.find(t => String(t.MaLoaiMonAn) === String(selectedType))?.TenLoaiMonAn || 'Tất cả');
  const currentCategoryName = useMemo(() => {
    if (!selectedCategory) return '';
    const cat = availableCategories.find(c => c.MaDanhMuc === selectedCategory);
    return cat ? cat.TenDanhMuc : '';
  }, [selectedCategory, availableCategories]);
  const headingTitle = hasQuery
    ? currentTypeName
    : (selectedCategory && currentCategoryName
      ? `${currentTypeName} (${currentCategoryName})`
      : currentTypeName);

  // Sorting with price parsing
  const renderList = useMemo(() => {
    // Robust price parsing: handle strings with commas, currency symbols, etc.
    const parsePrice = (val) => {
      if (val == null) return NaN;
      if (typeof val === 'number') return val;
      // Remove any non-digit except dot and minus (e.g., "1,000,000 đ")
      const cleaned = String(val).replace(/[^0-9.-]+/g, '');
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : NaN;
    };

    const getMinPrice = (item) => {
      const variants = Array.isArray(item?.BienTheMonAn) ? item.BienTheMonAn : [];
      if (variants.length === 0) return Number.POSITIVE_INFINITY;
      const nums = variants
        .map(v => parsePrice(v?.GiaBan))
        .filter(n => !Number.isNaN(n));
      if (nums.length > 0) return Math.min(...nums);
      return Number.POSITIVE_INFINITY; // unknown price goes last in price sorts
    };
    
    // Calculate the effective (discounted) min price for an item, applying product promotion if present
    const getMinDiscountedPrice = (item) => {
      const baseMin = getMinPrice(item);
      if (!Number.isFinite(baseMin)) return Number.POSITIVE_INFINITY;
      const promotion = item?.KhuyenMai || item?.promotion || null;
      if (!promotion) return baseMin;
      const kmLoai = (promotion.KMLoai || '').toUpperCase();
      const kmGiaTri = Number(promotion.KMGiaTri || 0);
      if (kmLoai === 'PERCENT' || kmLoai === 'PHANTRAM') {
        const discounted = baseMin - (baseMin * kmGiaTri / 100);
        return Math.max(0, discounted);
      } else if (kmLoai === 'AMOUNT' || kmLoai === 'SOTIEN') {
        const discounted = baseMin - kmGiaTri;
        return Math.max(0, discounted);
      }
      return baseMin;
    };

    const clone = [...filtered];
    switch (sort) {
      case 'name.asc':
        return clone.sort((a, b) => String(a.TenMonAn || '').localeCompare(String(b.TenMonAn || ''), 'vi'));
      case 'name.desc':
        return clone.sort((a, b) => String(b.TenMonAn || '').localeCompare(String(a.TenMonAn || ''), 'vi'));
      case 'price.asc':
        return clone.sort((a, b) => getMinDiscountedPrice(a) - getMinDiscountedPrice(b));
      case 'price.desc':
        return clone.sort((a, b) => getMinDiscountedPrice(b) - getMinDiscountedPrice(a));
      default:
        return clone;
    }
  }, [filtered, sort]);
  return (
    <section className="py-4">
      <Container>
        {/* Mobile filter toggle */}
        <button className={styles.mobileFiltersToggle} onClick={() => setShowDrawer(true)}>☰ Bộ lọc</button>
        <div className={styles.topBar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              placeholder="Tìm món (gõ để tìm toàn bộ)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select className={styles.sortSelect} value={sort} onChange={(e)=>setSort(e.target.value)}>
            <option value="default">Sắp xếp</option>
            <option value="name.asc">Tên A-Z</option>
            <option value="name.desc">Tên Z-A</option>
            <option value="price.asc">Giá tăng dần</option>
            <option value="price.desc">Giá giảm dần</option>
          </select>
        </div>
        <div className={styles.menuLayout}>
          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <div>
              <div className={styles.sidebarSectionTitle}>Loại món ăn</div>
              <div className={styles.typeList}>
                {types.map(type => {
                  const active = String(selectedType) === String(type.MaLoaiMonAn);
                  return (
                    <div
                      key={type.MaLoaiMonAn}
                      className={`${styles.filterItem} ${active ? styles.active : ''}`}
                      onClick={() => { setSelectedType(String(type.MaLoaiMonAn)); setSelectedCategory(null); }}
                    >
                      <span>{type.TenLoaiMonAn}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {!hasQuery && availableCategories.length > 0 && (
              <div>
                <div className={styles.sidebarSectionTitle}>Danh mục</div>
                <div className={styles.categoryList}>
                  <div
                    className={`${styles.filterItem} ${selectedCategory === null ? styles.active : ''}`}
                    onClick={() => setSelectedCategory(null)}
                  >Tất cả</div>
                  {availableCategories.map(cat => {
                    const active = selectedCategory === cat.MaDanhMuc;
                    return (
                      <div
                        key={cat.MaDanhMuc}
                        className={`${styles.filterItem} ${active ? styles.active : ''}`}
                        onClick={() => setSelectedCategory(cat.MaDanhMuc)}
                      >{cat.TenDanhMuc}</div>
                    );
                  })}
                </div>
              </div>
            )}
          </aside>

          {/* Content */}
          <div>
            <h2 style={{ fontWeight: 800, marginBottom: '1.2rem' }}>{headingTitle}</h2>
            {loading && (
              <div className={styles.grid}>
                {Array.from({ length: 8 }).map((_, i) => <div key={i} className={styles.skeletonCard} />)}
              </div>
            )}
            {!loading && error && (
              <div className="alert alert-warning d-flex align-items-center" role="alert">
                <Spinner animation="border" size="sm" className="me-2" />
                <div>{error}</div>
              </div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className={styles.emptyWrap}>
                <EmptyState title="Không tìm thấy món ăn" description="Thử từ khóa khác hoặc bỏ bớt bộ lọc." />
              </div>
            )}
            {!loading && !error && renderList.length > 0 && (
              <div className={styles.grid}>
                {renderList.map(pizza => (
                  <ProductCard key={pizza.MaMonAn} pizza={pizza} />
                ))}
              </div>
            )}
          </div>
        </div>
        {showDrawer && (
          <>
            <div className={styles.backdrop} onClick={() => setShowDrawer(false)} />
            <div className={styles.mobileDrawer}>
              <div className={styles.drawerHeader}>
                <strong>Bộ lọc</strong>
                <button className={styles.closeBtn} onClick={() => setShowDrawer(false)}>Đóng</button>
              </div>
              <div>
                <div className={styles.sidebarSectionTitle}>Loại món ăn</div>
                <div className={styles.typeList}>
                  {types.map(type => {
                    const active = String(selectedType) === String(type.MaLoaiMonAn);
                    return (
                      <div
                        key={type.MaLoaiMonAn}
                        className={`${styles.filterItem} ${active ? styles.active : ''}`}
                        onClick={() => { setSelectedType(String(type.MaLoaiMonAn)); setSelectedCategory(null); }}
                      >{type.TenLoaiMonAn}</div>
                    );
                  })}
                </div>
              </div>
              {!hasQuery && availableCategories.length > 0 && (
                <div>
                  <div className={styles.sidebarSectionTitle}>Danh mục</div>
                  <div className={styles.categoryList}>
                    <div
                      className={`${styles.filterItem} ${selectedCategory === null ? styles.active : ''}`}
                      onClick={() => setSelectedCategory(null)}
                    >Tất cả</div>
                    {availableCategories.map(cat => {
                      const active = selectedCategory === cat.MaDanhMuc;
                      return (
                        <div
                          key={cat.MaDanhMuc}
                          className={`${styles.filterItem} ${active ? styles.active : ''}`}
                          onClick={() => setSelectedCategory(cat.MaDanhMuc)}
                        >{cat.TenDanhMuc}</div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </Container>
      <ChatShortcut />
    </section>
  );
};

export default MenuPage;
