import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useFirestoreConnect, isLoaded, isEmpty } from "react-redux-firebase";
import { makeStyles } from "@material-ui/core/styles";
import { Container, AppBar, Tabs, Tab } from "@material-ui/core";
import {
  PersonPin as PersonPinIcon,
  EventNote as EventNoteIcon,
} from "@material-ui/icons";

import AppbarCustomer from "@/components/layout/AppbarCustomer";
import AppbarAdmin from "@/components/layout/AppbarAdmin";
import CustomerAreaCalendar from "./CustomerAreaCalendar";

import { wrapOrganization } from "@/utils/firestore";
import { LocalStore } from "@/types/store";
import { OrgSubCollection } from "@/enums/firestore";

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

/** @TODO make these imported selectors */
const selectAuth = (state: LocalStore) => state.firebase.auth;
const selectBookings = (state: LocalStore) => state.firestore.ordered.bookings;

export const CustomerAreaPage: React.FC = () => {
  const classes = useStyles();

  const { secretKey } = useParams() as { secretKey: string };

  const customerData = useSelector(selectBookings);
  const auth = useSelector(selectAuth);

  useFirestoreConnect([
    wrapOrganization({
      collection: OrgSubCollection.Bookings,
      doc: secretKey,
    }),
  ]);

  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (e: React.ChangeEvent<unknown>, newValue: any) => {
    setActiveTab(newValue);
  };

  const title =
    isLoaded(customerData) && Boolean(customerData[0])
      ? `${customerData[0].name} ${customerData[0].surname}`
      : "";

  return (
    <>
      {isLoaded(auth) && !isEmpty(auth) && <AppbarAdmin />}
      <AppbarCustomer headingText={title} />

      <main className={(classes as any).content}>
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
                  <LinkTab label="Prenota" icon={<EventNoteIcon />} />
                  <LinkTab label="Calendario" icon={<PersonPinIcon />} />
                </Tabs>
              </Container>
            </AppBar>
            <TabPanel value={activeTab} index={0}>
              <CustomerAreaCalendar
                category={(customerData[0] as any).category}
              />
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
