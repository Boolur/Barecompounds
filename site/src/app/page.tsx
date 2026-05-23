import PromoBar from "@/components/home/PromoBar";
import EditorialNav from "@/components/ui/EditorialNav";
import ScrollHero from "@/components/home/ScrollHero";
import BrandStatement from "@/components/home/BrandStatement";
import CompoundIndex from "@/components/home/CompoundIndex";
import VerificationTeaser from "@/components/home/VerificationTeaser";
import JournalTeaser from "@/components/home/JournalTeaser";
import Footer from "@/components/ui/Footer";

export default function Home() {
  return (
    <>
      <PromoBar />
      <EditorialNav />
      <main>
        <ScrollHero />
        <BrandStatement />
        <CompoundIndex />
        <VerificationTeaser />
        <JournalTeaser />
      </main>
      <Footer />
    </>
  );
}
