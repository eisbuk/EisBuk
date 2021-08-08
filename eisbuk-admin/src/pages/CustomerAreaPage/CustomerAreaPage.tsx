import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useFirestoreConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { useTranslation } from "react-i18next";

import Container from "@material-ui/core/Container";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";

import PersonPinIcon from "@material-ui/icons/PersonPin";
import EventNoteIcon from "@material-ui/icons/EventNote";

import makeStyles from "@material-ui/core/styles/makeStyles";

import { OrgSubCollection } from "eisbuk-shared";

import AppbarCustomer from "@/components/layout/AppbarCustomer";
import AppbarAdmin from "@/components/layout/AppbarAdmin";
import CustomerAreaCalendar from "@/pages/CustomerAreaPage/CustomerAreaCalendar";

import { getFirebaseAuth } from "@/store/selectors/auth";
import { getBookingsCustomer } from "@/store/selectors/bookings";

import { wrapOrganization } from "@/utils/firestore";

// ***** Region Link Tab ***** //
type TabProps = Parameters<typeof Tab>[0];
type LinkTabProps = Omit<Omit<TabProps, "component">, "onClick">;

const LinkTab: React.FC<LinkTabProps> = (props) => {
  return (
    <Tab
      onClick={(event) => {
        event.preventDefault();
      }}
      {...props}
    />
  );
};
// ***** End Region Link Tab ***** //

// ***** Region Tab Panel ***** //
interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  ...props
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customer-tabpanel-${index}`}
      {...props}
    >
      {value === index && children}
    </div>
  );
};
// ***** End Region Tab Panel ***** //

export const CustomerAreaPage: React.FC = () => {
  const classes = useStyles();

  const { secretKey } = useParams() as { secretKey: string };

  const customerData = useSelector(getBookingsCustomer);
  const auth = useSelector(getFirebaseAuth);

  useFirestoreConnect([
    wrapOrganization({
      collection: OrgSubCollection.Bookings,
      doc: secretKey,
    }),
  ]);

  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (e: React.ChangeEvent<unknown>, newValue: number) => {
    setActiveTab(newValue);
  };

  const title =
    isLoaded(customerData) && Boolean(customerData[0])
      ? `${customerData[0].name} ${customerData[0].surname}`
      : "";

  const { t } = useTranslation();

  return (
    <>
      {isLoaded(auth) && !isEmpty(auth) && <AppbarAdmin />}
      <AppbarCustomer headingText={title} />

      <main>
        {isLoaded(customerData) && !isEmpty(customerData) && (
          <>
            <AppBar position="static" className={classes.customerNav}>
              <Container maxWidth="xl">
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  centered
                >
                  <LinkTab
                    label={t("CustomerArea.Book")}
                    icon={<EventNoteIcon />}
                  />
                  <LinkTab
                    label={t("CustomerArea.Calendar")}
                    icon={<PersonPinIcon />}
                  />
                </Tabs>
              </Container>
            </AppBar>
            <TabPanel value={activeTab} index={0}>
              <CustomerAreaCalendar category={customerData[0].category} />
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <CustomerAreaCalendar
                view="bookings"
                category={customerData[0].category}
              />
            </TabPanel>
          </>
        )}
      </main>
    </>
  );
};

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
  appBarSpacer: theme.mixins.toolbar,
  customerNav: {
    backgroundColor: theme.palette.secondary.main,
  },
}));

export default CustomerAreaPage;
