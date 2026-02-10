import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Friends } from "./pages/Friends";
import { Events } from "./pages/Events";
import { EventDetail } from "./pages/EventDetail";
import { Explore } from "./pages/Explore";
import { Profile } from "./pages/Profile";
import { Root } from "./pages/Root";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: "friends", Component: Friends },
      { path: "events", Component: Events },
      { path: "events/:id", Component: EventDetail },
      { path: "explore", Component: Explore },
      { path: "profile", Component: Profile },
    ],
  },
]);
