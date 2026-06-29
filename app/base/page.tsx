import { SiteNav } from "../components/SiteNav";
import { Ciqual2SearchClient } from "../ciqual2/Ciqual2SearchClient";

export default function BasePage() {
  return (
    <main>
      <SiteNav section="base" showSubTabs />
      <Ciqual2SearchClient />
    </main>
  );
}
