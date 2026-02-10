import { useState } from "react";
import { useNavigate } from "react-router";
import { Calendar, MapPin, Users, Filter, Plus, Palette, Code, Gamepad2, MessageSquare, BookOpen, Activity, Heart, Clock } from "lucide-react";
import { mockEvents } from "../data/mockData";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const eventTypeIcons = {
  creative: Palette,
  tech: Code,
  games: Gamepad2,
  social: MessageSquare,
  learning: BookOpen,
  activity: Activity,
  community: Heart,
};

const intensityColors = {
  chill: "bg-green-100 text-green-700 border-green-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  high: "bg-red-100 text-red-700 border-red-200",
};

export function Events() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [filterType, setFilterType] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const filteredEvents = filterType === "all" 
    ? mockEvents 
    : mockEvents.filter(e => e.type === filterType);

  const upcomingEvents = filteredEvents.filter(e => !e.isLive);
  const happeningNow = filteredEvents.filter(e => e.isLive);

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl">Events</h1>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-1" />
            Create
          </Button>
        </div>

        {/* Filter Toggle */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          {filterType !== "all" && (
            <Badge 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => setFilterType("all")}
            >
              {filterType} ✕
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      <div className="px-4">
        {showFilters && (
          <Card className="p-4 mb-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Event Type</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(eventTypeIcons).map(([type, Icon]) => (
                    <Button
                      key={type}
                      variant={filterType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterType(type)}
                      className="flex items-center gap-1"
                    >
                      <Icon className="w-3 h-3" />
                      {type}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Friend Filters</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">All Events</Button>
                  <Button variant="outline" size="sm">Friends' Events</Button>
                  <Button variant="outline" size="sm">Friends Attending</Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 rounded-none bg-white sticky top-[120px] z-10">
          <TabsTrigger value="happening" className="text-xs">
            Now
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="text-xs">Past</TabsTrigger>
          <TabsTrigger value="my-events" className="text-xs">Mine</TabsTrigger>
        </TabsList>

        {/* Happening Now */}
        <TabsContent value="happening" className="space-y-3 px-4 mt-4 m-0">
          {happeningNow.length === 0 ? (
            <Card className="p-12 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No events happening right now</p>
              <p className="text-sm mt-1">Check back soon!</p>
            </Card>
          ) : (
            happeningNow.map((event) => (
              <EventCard key={event.id} event={event} isLive navigate={navigate} />
            ))
          )}
        </TabsContent>

        {/* Upcoming Events */}
        <TabsContent value="upcoming" className="space-y-3 px-4 mt-4 m-0">
          {upcomingEvents.map((event) => (
            <EventCard key={event.id} event={event} navigate={navigate} />
          ))}
        </TabsContent>

        {/* Past Events */}
        <TabsContent value="past" className="px-4 mt-4 m-0">
          <Card className="p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Your past events will appear here</p>
          </Card>
        </TabsContent>

        {/* My Events */}
        <TabsContent value="my-events" className="px-4 mt-4 m-0">
          <Card className="p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>Events you're hosting will appear here</p>
            <Button className="mt-4">
              <Plus className="w-4 h-4 mr-1" />
              Create Your First Event
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventCard({ event, isLive = false, navigate }: { event: any; isLive?: boolean; navigate: any }) {
  const Icon = eventTypeIcons[event.type as keyof typeof eventTypeIcons];
  const startTime = new Date(event.startTime);
  const now = new Date();
  const timeUntil = Math.floor((startTime.getTime() - now.getTime()) / 60000);

  const formatTime = () => {
    if (isLive) return "LIVE NOW";
    if (timeUntil < 60) return `in ${timeUntil} mins`;
    if (timeUntil < 1440) return `in ${Math.floor(timeUntil / 60)} hours`;
    return startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <Card 
      className={`p-4 cursor-pointer active:scale-98 transition-transform ${
        isLive ? 'border-l-4 border-red-500 bg-red-50/30' : ''
      }`}
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div className="flex gap-3">
        {/* Event Icon */}
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isLive ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          <Icon className={`w-7 h-7 ${isLive ? 'text-red-600' : 'text-blue-600'}`} />
        </div>

        {/* Event Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {isLive && (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                ● LIVE
              </Badge>
            )}
            <span className="text-xs text-gray-600">{formatTime()}</span>
          </div>
          
          <h3 className="font-medium mb-1 text-base">{event.title}</h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>

          <div className="flex items-center gap-3 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {event.participants}/{event.maxParticipants}
            </div>
            {event.friendsAttending.length > 0 && (
              <div className="flex items-center gap-1 text-blue-600">
                <span>👥</span>
                {event.friendsAttending.length} friends
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
