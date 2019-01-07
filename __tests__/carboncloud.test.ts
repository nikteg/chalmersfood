import { mapCarbonCloudResult } from "../src/restaurants";
import * as response from "./request-1546862455012.json";

test("correctly parses request", () => {
  expect(mapCarbonCloudResult(response)).toEqual([
    [
      "Classic Fisk – Ångkokt torsk, äggsås & kokt potatis",
      "Classic Kött – Persiljebakad kyckling, svampsås & hasselbackspotatis",
      "Classic Vegan – Vit böngryta, rotselleri, tomat, örtkräm & potatispuré",
      "Veckans Sallad – Friterad kycklingsallad, parmesandressing & säsongens grönsaker"
    ],
    [
      "Classic Fisk – Bakad fisk, örtsås & kokt potatis",
      "Classic Kött – Stekt fläsk, raggmunk, rårörda lingon",
      "Classic Vegan – Svamprisotto, black-eye bönor & stekt svampsallad",
      "Veckans Sallad – Friterad kycklingsallad, parmesandressing & säsongens grönsaker"
    ],
    [
      "Classic Fisk – Persiljestekt strömming, potatispuré, skirat smör & lingon",
      "Classic Kött – Ratatouillebakad färsbiff, getostkräm & rostad potatis",
      "Classic Vegan – Pasta, soltorkade tomater, sojafärs & purjolök",
      "Veckans Sallad – Friterad kycklingsallad, parmesandressing & säsongens grönsaker"
    ],
    [
      "Classic Fisk – Sprödstekt fisk, persiljekräm & potatispuré",
      "Classic Kött – Pestobakad kycklingfilé & tomatrisotto",
      "Classic Kött – Ärtsoppa, fläsk, pannkakor & hemlagad sylt",
      "Classic Vegan – Tabbouleh, kikärtsbiff & ärthummus",
      "Veckans Sallad – Friterad kycklingsallad, parmesandressing & säsongens grönsaker"
    ],
    [
      "Classic Fisk – Färskostbakad fisk, fänkål- & äpple coleslaw, rotfruktspuré",
      "Classic Kött – Svartpepparrostad högrev, bakad potatis & rostad majsaioli",
      "Classic Vegan – Vegetarisk lasagne, blandade bönor, veganost & tomatopesto",
      "Veckans Sallad – Friterad kycklingsallad, parmesandressing & säsongens grönsaker"
    ]
  ]);
});
