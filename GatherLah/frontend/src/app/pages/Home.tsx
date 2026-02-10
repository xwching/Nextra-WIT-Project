import { useState } from "react";
import { MessageSquare, Coffee, TrendingUp, Sparkles, Send } from "lucide-react";
import { mockEvents, mockUsers, qotdAnswers, friendActivity, currentUser } from "../data/mockData";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Avatar } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";

export function Home() {
  const [mood, setMood] = useState("😊");
  const [qotdAnswer, setQotdAnswer] = useState("");
  const moods = ["😊", "😔", "😴", "🔥", "😌", "🎉"];

  const liveEvents = mockEvents.filter(e => e.isLive);
  const upcomingSoon = mockEvents.filter(e => !e.isLive).slice(0, 2);

  return (
    <div className="px-4 py-4 space-y-4 pb-20">
      {/* Header */}
      <div className="mb-2">
        <h1 className="text-xl mb-1">Good morning! 👋</h1>
        <p className="text-sm text-gray-600">Let's make today meaningful</p>
      </div>

      {/* Daily Rituals Section */}
      <Card className="p-4 space-y-4 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="flex items-center gap-2 font-medium">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Daily Rituals
        </h3>

        {/* Question of the Day */}
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 mt-1" />
            <div className="flex-1">
              <p className="font-medium">What's one thing you can't live without?</p>
              <input
                type="text"
                placeholder="Share your answer (1-2 sentences)..."
                value={qotdAnswer}
                onChange={(e) => setQotdAnswer(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-lg text-sm"
              />
              <button className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Send className="w-3 h-3" />
                Share
              </button>
            </div>
          </div>

          {/* Community Answers */}
          <div className="space-y-2 pl-7">
            {qotdAnswers.slice(0, 2).map((item, i) => (
              <div key={i} className="bg-white rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span>{item.user.avatar}</span>
                  <span className="font-medium">{item.user.name}</span>
                </div>
                <p className="text-gray-700">{item.answer}</p>
                <button className="text-xs text-gray-500 mt-1">❤️ {item.likes}</button>
              </div>
            ))}
            <button className="text-sm text-blue-600 hover:underline">
              See all {qotdAnswers.length} answers →
            </button>
          </div>
        </div>

        {/* Mood Check-in */}
        <div className="space-y-2">
          <p className="font-medium text-sm">How are you feeling?</p>
          <div className="flex gap-2">
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`text-2xl p-2 rounded-lg transition-all ${
                  mood === m ? "bg-white shadow-md scale-110" : "bg-white/50 hover:bg-white/80"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600">12 people feeling the same as you</p>
        </div>

        {/* Streak Counter */}
        <div className="bg-white rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Your streak</p>
              <p className="text-lg">5 days of meaningful conversations! 🔥</p>
            </div>
            <div className="text-3xl">🔥</div>
          </div>
        </div>
      </Card>

      {/* Random Coffee Match */}
      <Card className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50">
        <div className="flex items-start gap-3">
          <Coffee className="w-6 h-6 text-orange-600 mt-1" />
          <div className="flex-1">
            <p className="font-medium">Random Coffee Match</p>
            <p className="text-sm text-gray-600 mt-1">
              Meet {mockUsers[2].name} for a 10-min chat at 3pm?
            </p>
            <p className="text-xs text-gray-500 mt-1">💬 "What's your favorite creative hobby?"</p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">Accept</Button>
              <Button size="sm" variant="outline">Reschedule</Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Happening Now */}
      <div>
        <h3 className="flex items-center gap-2 mb-3 font-medium">
          <TrendingUp className="w-5 h-5 text-red-600" />
          Happening Now
        </h3>
        <div className="space-y-3">
          {liveEvents.map((event) => (
            <Card key={event.id} className="p-4 border-l-4 border-red-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-red-100 text-red-700 border-red-200">LIVE</Badge>
                    <span className="text-sm text-gray-600">
                      {event.participants}/{event.maxParticipants} people
                    </span>
                  </div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">Join Now</Button>
              </div>
            </Card>
          ))}
          {upcomingSoon.map((event) => {
            const startTime = new Date(event.startTime);
            const minsUntil = Math.floor((startTime.getTime() - Date.now()) / 60000);
            return (
              <Card key={event.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">Starting in {minsUntil} mins</Badge>
                      <span className="text-sm text-gray-600">
                        {event.participants}/{event.maxParticipants} spots
                      </span>
                    </div>
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                  <Button size="sm" variant="outline">Join</Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Friends Activity Feed */}
      <div>
        <h3 className="mb-3 font-medium">What Your Friends Are Up To</h3>
        <div className="space-y-2">
          {friendActivity.map((activity, i) => (
            <Card key={i} className="p-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{activity.user.avatar}</span>
                <div className="flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user.name}</span>{" "}
                    <span className="text-gray-600">{activity.action}</span>
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            </Card>
          ))}
          <div className="flex gap-2 mt-3">
            <Button variant="outline" size="sm" className="flex-1">
              <span className="text-green-600 mr-1">●</span> 3 friends online now
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">5-Min Hangout</Button>
          <Button variant="outline" size="sm">Create Event</Button>
          <Button variant="outline" size="sm">Find Friends</Button>
          <Button variant="outline" size="sm">Browse Rooms</Button>
        </div>
      </Card>

      {/* Your Impact */}
      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center space-y-1">
          <p className="text-sm text-gray-600">Your Impact This Month</p>
          <p className="text-lg">You've connected with 24 people</p>
          <p className="text-sm text-green-700">3 people said you made their day 💚</p>
          <button className="text-sm text-blue-600 hover:underline mt-2">
            View full dashboard →
          </button>
        </div>
      </Card>
    </div>
  );
}
