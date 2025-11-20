import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';
import TopBar from '../../components/TopBar';

interface ProductDetail {
  id: string;
  title: string;
  destination: string;
  category: string;
  description: string;
  coverImageUrl: string;
  netPrice: number;
  supplierName: string;
}

const AgencyTourDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  const fetchProductDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/agency/tours/${id}`);
      setProduct(response.data);
    } catch (err) {
      console.error('Failed to fetch product detail:', err);
      setError('無法載入產品詳情');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return `NT$${price.toLocaleString('zh-TW')}`;
  };

  const handleBack = () => {
    navigate('/agency/dashboard');
  };

  const categoryLabels: Record<string, string> = {
    'landmark': '地標',
    'activity': '活動',
    'accommodation': '住宿',
    'food': '餐飲',
    'transportation': '交通'
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="旅行社控制台" />
      <main className="p-8 max-w-6xl mx-auto">
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors mb-6 flex items-center gap-2"
        >
          ← 返回產品列表
        </button>

        {loading && <p className="text-center text-slate-500 py-8">載入中...</p>}
        {error && <p className="text-center text-red-500 py-8">{error}</p>}

        {!loading && !error && product && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <img
              src={product.coverImageUrl}
              alt={product.title}
              className="w-full max-h-[500px] object-cover"
            />
            <div className="p-8">
              <h2 className="text-3xl font-bold text-slate-800 mb-8">{product.title}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 p-6 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-500">目的地</span>
                  <span className="text-lg font-semibold text-slate-800">{product.destination}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-500">類別</span>
                  <span className="text-lg font-semibold text-slate-800">
                    {categoryLabels[product.category] || product.category}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-500">供應商</span>
                  <span className="text-lg font-semibold text-slate-800">{product.supplierName}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-slate-500">淨價</span>
                  <span className="text-2xl font-bold text-green-600">{formatPrice(product.netPrice)}</span>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">產品描述</h3>
                <div
                  className="prose prose-slate max-w-none text-slate-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AgencyTourDetailPage;
