import PromoBar from "@/components/home/PromoBar";
import EditorialNav from "@/components/ui/EditorialNav";
import ScrollHero from "@/components/home/ScrollHero";
import BrandStatement from "@/components/home/BrandStatement";
import CompoundIndex from "@/components/home/CompoundIndex";
import HomepageSections from "@/components/home/HomepageSections";
import VerificationTeaser from "@/components/home/VerificationTeaser";
import JournalTeaser from "@/components/home/JournalTeaser";
import Footer from "@/components/ui/Footer";
import { RecoveryRedirect } from "@/components/auth/RecoveryRedirect";
import {
  getBestSellers,
  getFeaturedProducts,
  getShopProducts,
} from "@/lib/commerce";

export default async function Home() {
  const [products, featuredProducts, bestSellers] = await Promise.all([
    getShopProducts(),
    getFeaturedProducts(),
    getBestSellers(),
  ]);
  const categories = Array.from(
    products.reduce((groups, product) => {
      const names = groups.get(product.category) ?? [];
      names.push(product.name);
      groups.set(product.category, names);
      return groups;
    }, new Map<string, string[]>()),
    ([name, productNames]) => ({ name, products: productNames }),
  );

  return (
    <>
      <RecoveryRedirect />
      <PromoBar />
      <EditorialNav />
      <main id="main-content">
        <ScrollHero />
        <CompoundIndex products={products} />
        <BrandStatement />
        <HomepageSections
          featuredProducts={featuredProducts}
          bestSellers={bestSellers}
          categories={categories}
        />
        <VerificationTeaser />
        <JournalTeaser />
      </main>
      <Footer />
    </>
  );
}
