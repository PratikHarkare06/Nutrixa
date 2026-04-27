import { useEffect } from "react";
import { UploadCard } from "../components/UploadCard";
import { useUploadStore } from "../store/uploadStore";

type DashboardPageProps = {
  onUploadSuccess: () => void;
};

const featureItems = [
  { label: "Food Detection", color: "#F97316" }, // primary
  { label: "Volume Estimation", color: "#3B82F6" }, // info
  { label: "Calorie Analysis", color: "#A855F7" }, // purple
  { label: "Health Advice", color: "#10B981" }, // success
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
    <div className="flex-1 overflow-y-auto px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-sm font-medium text-textMuted mb-4">Dashboard</div>

        <h1 className="text-3xl font-bold tracking-tight text-textMain mb-2">
          Food Upload &amp; Analysis Dashboard
        </h1>
        <p className="text-sm text-textMuted mb-8">
          Upload food images for AI-powered nutritional analysis and personalized health insights
        </p>

        <div className="mb-16">
          <UploadCard
            dragActive={dragActive}
            errorMessage={errorMessage}
            isUploading={isUploading}
            onDragChange={(active) => {
              clearError();
              setDragActive(active);
            }}
            onFileSelected={async (file, mealType) => {
              clearError();
              const success = await uploadImage(file, mealType);
              if (success) {
                onUploadSuccess();
              }
            }}
          />
        </div>

        <section className="text-center max-w-2xl mx-auto">
          <h2 className="text-xl font-bold tracking-tight text-textMain mb-4">
            Ready to Analyze Your Food?
          </h2>
          <p className="text-sm text-textMuted leading-relaxed mb-8">
            Upload an image of your meal to get started with AI-powered nutritional analysis, volume estimation, and personalized health recommendations.
          </p>

          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
            {featureItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm font-medium text-textMuted">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
