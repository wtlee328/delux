import React, { useState, useEffect } from 'react';
import axios from '../../config/axios';
import { useNavigate, useParams } from 'react-router-dom';
import TopBar from '../../components/TopBar';

type ProductStatus = '草稿' | '待審核' | '已發佈' | '需要修改';

interface ProductDetail {
  id: string;
  title: string;
  destination: string;
  category: string;
  description: string;
  coverImageUrl: string;
  netPrice: number;
  status: ProductStatus;
  rejectionReason?: string;
  supplierName: string;
  createdAt: string;
}

const AdminTourDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`/api/admin/tours/${id}`);
      setProduct(response.data);
    } catch (err: any) {
      setError('無法載入產品詳情');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!product) return;

    try {
      setUpdating(true);
      setError(null);
      await axios.put(`/api/admin/tours/${id}/status`, { status: '已發佈' });

      // Update local state
      setProduct({ ...product, status: '已發佈' });
      setUpdateSuccess(true);

      // Hide success message after 2 seconds
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (err: any) {
      setError('核准失敗');
      console.error('Error approving product:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRequestRevisions = () => {
    setShowRevisionModal(true);
  };

  const handleSubmitRevisionRequest = async () => {
    if (!product) return;

    if (!revisionFeedback.trim()) {
      setError('請輸入修改意見');
      return;
    }

    try {
      setUpdating(true);
      setError(null);
      await axios.put(`/api/admin/tours/${id}/status`, {
        status: '需要修改',
        feedback: revisionFeedback
      });

      // Update local state
      setProduct({ ...product, status: '需要修改', rejectionReason: revisionFeedback });
      setUpdateSuccess(true);
      setShowRevisionModal(false);
      setRevisionFeedback('');

      // Hide success message after 2 seconds
      setTimeout(() => setUpdateSuccess(false), 2000);
    } catch (err: any) {
      setError('提交修改要求失敗');
      console.error('Error requesting revisions:', err);
    } finally {
      setUpdating(false);
    }
  };

  const formatPrice = (price: number) => {
    return `NT$${price.toLocaleString('zh-TW')}`;
  };

  const categoryLabels: Record<string, string> = {
    'landmark': '地標',
    'activity': '活動',
    'accommodation': '住宿',
    'food': '餐飲',
    'transportation': '交通'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopBar title="產品詳情" />
        <main className="p-8 max-w-7xl mx-auto">
          <p className="text-center text-slate-500 py-8">載入中...</p>
        </main>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <TopBar title="產品詳情" />
        <main className="p-8 max-w-7xl mx-auto">
          <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 border border-red-200">{error}</div>
          <button onClick={() => navigate('/admin/tours')} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium mb-6">
            返回產品列表
          </button>
        </main>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TopBar title="產品詳情" />
      <main className="p-8 max-w-7xl mx-auto">
        <button onClick={() => navigate('/admin/tours')} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium mb-6 flex items-center gap-2">
          ← 返回產品列表
        </button>

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 border border-red-200">{error}</div>}
        {updateSuccess && <div className="p-4 bg-green-50 text-green-700 rounded-lg mb-4 border border-green-200">狀態更新成功</div>}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="w-full h-[400px] bg-slate-100 overflow-hidden relative">
            <img
              src={product.coverImageUrl}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="p-8 border-b border-slate-100">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">{product.title}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-500">供應商：</span>
                <span className="text-base text-slate-800 font-medium">{product.supplierName}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-500">目的地：</span>
                <span className="text-base text-slate-800 font-medium">{product.destination}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-500">類別：</span>
                <span className="text-base text-slate-800 font-medium">
                  {categoryLabels[product.category] || product.category}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-500">淨價：</span>
                <span className="text-base text-slate-800 font-medium">{formatPrice(product.netPrice)}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-slate-500">狀態：</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold inline-block w-fit ${product.status === '草稿' ? 'bg-slate-500 text-white' :
                  product.status === '待審核' ? 'bg-amber-400 text-black' :
                    product.status === '已發佈' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                  {product.status}
                </span>
              </div>
            </div>

            {product.status === '待審核' && (
              <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">審核操作</h3>
                <p className="text-slate-600 mb-4">此產品正在等待審核</p>
                <div className="flex gap-4">
                  <button
                    onClick={handleApprove}
                    disabled={updating}
                    className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? '處理中...' : '核准發佈'}
                  </button>
                  <button
                    onClick={handleRequestRevisions}
                    disabled={updating}
                    className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    要求修改
                  </button>
                </div>
              </div>
            )}

            {product.status === '已發佈' && (
              <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-100">
                <p className="text-green-700 font-medium flex items-center gap-2">
                  <span className="text-xl">✓</span> 此產品已發佈，對旅行社可見
                </p>
              </div>
            )}

            {product.status === '需要修改' && (
              <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-red-700 font-medium mb-2">此產品需要供應商修改</p>
                {product.rejectionReason && (
                  <div className="text-red-600 text-sm bg-white p-3 rounded border border-red-100">
                    <span className="font-bold block mb-1">修改建議：</span>
                    {product.rejectionReason}
                  </div>
                )}
              </div>
            )}

            {product.status === '草稿' && (
              <div className="mt-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-slate-600 font-medium">此產品為草稿狀態，尚未提交審核</p>
              </div>
            )}
          </div>

          <div className="p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">產品描述</h3>
            <div
              className="prose prose-slate max-w-none text-slate-600"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </div>

        {showRevisionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200" onClick={() => setShowRevisionModal(false)}>
            <div className="bg-white rounded-xl p-8 max-w-lg w-[90%] shadow-xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">要求修改</h3>
              <p className="text-slate-600 mb-4">請輸入需要供應商修改的內容：</p>
              <textarea
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent mb-6 min-h-[120px]"
                placeholder="請詳細說明需要修改的地方..."
                rows={5}
              />
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowRevisionModal(false);
                    setRevisionFeedback('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                  disabled={updating}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitRevisionRequest}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updating || !revisionFeedback.trim()}
                >
                  {updating ? '提交中...' : '提交'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminTourDetailPage;
