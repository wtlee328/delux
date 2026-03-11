import React from 'react';

interface DraftStatusFooterProps {
  status: string;
  rejectionReason?: string | null;
  onSaveDraft?: () => void;
  onSubmitForReview: () => void;
  onWithdraw?: () => void;
  isSubmitting: boolean;
  itemType: '產品' | '行程';
}

const DraftStatusFooter: React.FC<DraftStatusFooterProps> = ({
  status,
  rejectionReason,
  onSaveDraft,
  onSubmitForReview,
  onWithdraw,
  isSubmitting,
  itemType
}) => {
  const getStatusStyle = (s: string) => {
    switch (s) {
      case '已發佈':
        return 'bg-green-500 text-white border-green-600';
      case '待審核':
      case '審核中':
        return 'bg-amber-400 text-black border-amber-500';
      case '需要修改':
      case '已退回':
        return 'bg-red-500 text-white border-red-600';
      default:
        return 'bg-slate-500 text-white border-slate-600';
    }
  };

  const displayStatus = status === '待審核' ? '審核中' : status === '需要修改' ? '已退回' : status;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center z-50">
      <div className="max-w-7xl mx-auto w-full flex justify-between items-center px-4 md:px-8">
        <div className="flex items-center gap-4">
          <div className={`px-4 py-1.5 rounded-full text-sm font-bold border ${getStatusStyle(status)}`}>
            {displayStatus}
          </div>
          {(status === '已退回' || status === '需要修改') && rejectionReason && (
            <div className="text-red-600 text-sm font-medium italic animate-pulse">
              原因：{rejectionReason}
            </div>
          )}
          {(status === '草稿') && (
            <span className="text-slate-500 font-medium hidden md:inline">此{itemType}目前為草稿狀態</span>
          )}
          {(status === '待審核' || status === '審核中') && (
            <span className="text-slate-500 font-medium hidden md:inline">此{itemType}正在審核中</span>
          )}
        </div>
        
        <div className="flex gap-4">
          {onSaveDraft && (status === '草稿' || status === '已退回' || status === '需要修改') && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={isSubmitting}
              className="px-6 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 font-bold transition-all disabled:opacity-50 text-slate-700"
            >
              儲存草稿
            </button>
          )}
          
          {(status === '草稿' || status === '已退回' || status === '需要修改') && (
            <button
              type="button"
              onClick={onSubmitForReview}
              disabled={isSubmitting}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              提交審核
            </button>
          )}

          {(status === '待審核' || status === '審核中') && onWithdraw && (
            <button
              type="button"
              onClick={onWithdraw}
              disabled={isSubmitting}
              className="px-6 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 font-bold transition-all disabled:opacity-50"
            >
              撤回至草稿
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DraftStatusFooter;
