import { getOrgFromLocation } from "@/config/envInfo";

it("splits on the first double dash and returns the first part", async () => {
  expect(getOrgFromLocation("no-double-dashes.web.app")).toEqual(
    "no-double-dashes.web.app"
  );
  expect(getOrgFromLocation("one--double-dash-randomhash.web.app")).toEqual(
    "one.web.app"
  );
  expect(getOrgFromLocation("two--double--dashes-randomhash.web.app")).toEqual(
    "two.web.app"
  );
});
