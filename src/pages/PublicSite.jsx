
import Hero from "../components/Hero";
import PackagesSection from "../components/PackagesSection";
import DestinationSection from "../components/Destination";
import TestimonialsSection from "../components/TestimonialsSection";
import HappyMomentsSection from "../components/HappyMomentsSection";
import BlogSection from "../components/BlogSection";
import AboutSection from "../components/AboutSection";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";
import Seo, { SITE_URL } from "../components/Seo";
import { useState } from "react";
import OfferBanner from "../components/OfferBanner";
import BatchSection from "../components/BatchSection";
import ContactSection from "../components/ContactSection";
import SectionDivider, {ATMOSPHERE as A} from "../components/Sectiondivider";
import SeasonalSection from "../components/SeasonalSection";

const homeJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Manyara Prive Vacations Holiday",
    url: SITE_URL,
    description:
      "Honest, curated travel packages to India's most-visited destinations, planned by people who've actually been there.",
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Manyara Prive Vacations Holiday",
    url: SITE_URL,
  },
];

export default function PublicSite({onPlanTrip}) {
  const[showEnquiry,setShowEnquiry] =useState(false);

  return (
    <div className="min-h-screen">
      <Seo

        description="Honest, curated travel packages to India's most-visited destinations, planned by people who've actually been there."
        path="/"
        jsonLd={homeJsonLd}
      />
      


<Hero onPlanTrip={onPlanTrip} />




<DestinationSection />

<OfferBanner />

<SeasonalSection />

<SectionDivider variant="ticket" color={A.blush} />


<PackagesSection />


<HappyMomentsSection />

<SectionDivider vairant="line" color={A.blush} />

<AboutSection />

<TestimonialsSection />


<SectionDivider vairant="line" color={A.blush} />

<BlogSection />
<ContactSection />

<FAQSection />

<SectionDivider vriant="curve" from={A.alt} to={A.ink} />

<Footer />


    </div>
  );
}
