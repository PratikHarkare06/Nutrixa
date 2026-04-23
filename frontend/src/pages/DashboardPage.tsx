import { useEffect } from "react";
import { UploadCard } from "../components/UploadCard";
import { ArrowRightIcon, HomeIcon } from "../components/icons";
import { useUploadStore } from "../store/uploadStore";

type DashboardPageProps = {
  onUploadSuccess: () => void;
};

const featureItems = [
  { label: "Food Detection", color: "#ff7a12" },
  { label: "Volume Estimation", color: "#ffa53f" },
  { label: "Calorie Analysis", color: "#37d69b" },
  { label: "Health Advice", color: "#ffb44f" },
];

export const DashboardPage = ({ onUploadSuccess }: DashboardPageProps) => {
  const cancelUpload = useUploadStore((state) => state.cancelUpload);
  const clearError = useUploadStore((state) => state.clearError);
  const dragActive = useUploadStore((state) => state.dragActive);
  const errorMessage = useUploadStore((state) => state.errorMessage);
  const isUploading = useUploadStore((state) => state.isUploading);
  const setDragActive = useUploadStore((state) => state.setDragActive);
  const uploadImage = useUploadStore((state) => state.uploadImage);

  useEffect(() => () => cancelUpload(), [cancelUpload]);

  return (
    <main className="mx-auto max-w-[880px] px-[32px] pb-[74px] pt-[46px]">
      <div className="flex items-center gap-[10px] text-[20px] font-[700] tracking-[-0.02em] text-[#f4f6fb]">
        <HomeIcon className="h-[24px] w-[24px]" />
        <span>Dashboard</span>
      </div>

      <h1 className="mt-[34px] max-w-[760px] text-[62px] font-[700] leading-[0.98] tracking-[-0.055em] text-[#f4f6fb]">
        Food Upload &amp; Analysis Dashboard
      </h1>
      <p className="mt-[37px] max-w-[760px] text-[29px] font-[400] leading-[1.58] tracking-[-0.035em] text-[#95a3be]">
        Upload food images for AI-powered nutritional analysis and personalized health insights
      </p>

      <div className="mt-[84px]">
        <UploadCard
          dragActive={dragActive}
          errorMessage={errorMessage}
          isUploading={isUploading}
          onDragChange={(active) => {
            clearError();
            setDragActive(active);
          }}
          onFileSelected={async (file) => {
            clearError();
            const success = await uploadImage(file);
            if (success) {
              onUploadSuccess();
            }
          }}
        />
      </div>

      <section className="px-[17px] pt-[109px]">
        <h2 className="text-center text-[49px] font-[700] leading-[1.02] tracking-[-0.05em] text-[#f4f6fb]">
          Ready to Analyze Your Food?
        </h2>
        <p className="mt-[31px] text-[29px] font-[400] leading-[1.58] tracking-[-0.035em] text-[#95a3be]">
          Upload an image of your meal to get started with AI-powered nutritional analysis, volume estimation, and personalized health recommendations.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-y-[338px] px-[17px] pb-[288px] pt-[264px]">
        {featureItems.map((item) => (
          <div key={item.label} className="flex items-center gap-[14px]">
            <span className="h-[17px] w-[17px] rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[21px] font-[600] tracking-[-0.025em] text-[#96a4bf]">{item.label}</span>
          </div>
        ))}
      </section>

      <section className="rounded-[31px] border border-[#22314f] bg-[#1a202c] px-[48px] py-[48px]">
        <div className="flex items-center justify-between gap-[20px]">
          <div>
            <h3 className="text-[28px] font-[500] leading-none tracking-[-0.03em] text-[#f4f6fb]">
              Recent Analysis
            </h3>
            <p className="mt-[19px] text-[23px] font-[400] leading-none tracking-[-0.03em] text-[#95a3be]">
              You haven&apos;t analyzed any food yet
            </p>
          </div>
          <ArrowRightIcon className="h-[33px] w-[33px] text-[#ff7a12]" />
        </div>
      </section>
    </main>
  );
};
