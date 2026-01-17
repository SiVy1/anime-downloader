import React from "react";

interface LinkModalProps {
  folders: string[];
  isLinking: boolean;
  onLink: (folderName: string) => void;
  onClose: () => void;
}

export const LinkModal: React.FC<LinkModalProps> = ({
  folders,
  isLinking,
  onLink,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-white">
      <div
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-black italic uppercase tracking-tighter">
            Powiąż z folderem
          </h2>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
            Wybierz lokalny folder zawierający odcinki
          </p>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            {folders.map((folder) => (
              <button
                key={folder}
                disabled={isLinking}
                onClick={() => onLink(folder)}
                className="w-full p-4 bg-white/[0.02] hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 rounded-2xl transition-all text-left group"
              >
                <p className="text-xs font-bold uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                  {folder}
                </p>
              </button>
            ))}
          </div>
        </div>

        {isLinking && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4 z-50">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest">
              Skanowanie plików...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
