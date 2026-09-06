import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, MapPin, Calendar, Film, ChevronRight, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const EventDetailPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEventById(id)
      .then((res) => {
        setEvent(res.data.event);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <LoadingSpinner text="Loading showtimes..." />;
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Event not found</h2>
        <Link to="/events" className="text-cyan-400 text-sm mt-3 inline-block">
          Return to Events
        </Link>
      </div>
    );
  }

  const formatShowDate = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatShowTime = (isoStr) => {
    const d = new Date(isoStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Event Banner & Details */}
      <div className="rounded-3xl bg-[#0e1422] border border-slate-800 overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* Poster */}
        <div className="w-full md:w-80 h-72 md:h-auto bg-slate-900 shrink-0 relative">
          <img src={event.poster_url} alt={event.title} className="w-full h-full object-cover" />
          <div className="absolute top-4 left-4 px-3 py-1 rounded-xl bg-black/70 backdrop-blur-md text-xs font-bold text-cyan-400">
            {event.category}
          </div>
        </div>

        {/* Metadata */}
        <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">{event.title}</h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">{event.description}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80 text-xs">
            <div className="flex items-center space-x-2 text-slate-300">
              <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{event.duration_mins} Minutes</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">{event.venue_name}</span>
            </div>
            <div className="flex items-center space-x-2 text-slate-300">
              <Film className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{event.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Available Shows */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Available Shows & Timings</h2>
          <p className="text-xs text-slate-400 mt-1">Select a show to view real-time seat inventory and temporary locks</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {event.shows?.map((show) => (
            <Link
              key={show.id}
              to={`/shows/${show.id}/seats`}
              className="group p-5 rounded-2xl bg-[#0e1422] border border-slate-800 hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10 transition flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-400 flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{formatShowDate(show.show_time)}</span>
                  </div>
                  <div className="text-xl font-extrabold text-white font-mono mt-1">
                    {formatShowTime(show.show_time)}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/30 text-cyan-300 text-[10px] font-mono font-bold">
                  {show.format}
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px]">Price</span>
                  <span className="text-white font-mono font-bold">₹{show.base_price}</span>
                </div>

                <div className="flex items-center space-x-1 text-cyan-400 font-semibold group-hover:translate-x-1 transition">
                  <span>Select Seats</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
