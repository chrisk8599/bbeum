'use client';
import { useState } from 'react';
import { availabilityAPI } from '@/lib/api';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

export default function AvailabilityManagement({ schedule, blockers, onUpdate }) {
  const [editingDay, setEditingDay] = useState(null);
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockerForm, setBlockerForm] = useState({
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    reason: '',
  });
  const [timeError, setTimeError] = useState('');

  const getDaySchedule = (dayKey) => {
    return schedule.find(s => s.day_of_week === dayKey) || null;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5);
  };

  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 5) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  const handleUpdateDay = async (scheduleId, data) => {
    try {
      await availabilityAPI.updateScheduleDay(scheduleId, data);
      await onUpdate();
      setEditingDay(null);
    } catch (error) {
      alert('Failed to update schedule');
    }
  };

  const handleToggleDay = async (daySchedule) => {
    if (!daySchedule || !daySchedule.id) {
      alert('Schedule not loaded yet. Please refresh the page.');
      return;
    }
    await handleUpdateDay(daySchedule.id, {
      is_available: !daySchedule.is_available
    });
  };

  const handleTimeChange = async (daySchedule, field, value) => {
    if (!daySchedule || !daySchedule.id) {
      alert('Schedule not loaded yet. Please refresh the page.');
      return;
    }
    
    const currentStart = field === 'start_time' ? value : formatTime(daySchedule.start_time);
    const currentEnd = field === 'end_time' ? value : formatTime(daySchedule.end_time);
    
    if (currentStart && currentEnd && currentStart >= currentEnd) {
      alert('Start time must be before end time');
      return;
    }
    
    await handleUpdateDay(daySchedule.id, {
      [field]: value || null
    });
  };

  const handleCreateBlocker = async (e) => {
    e.preventDefault();
    setTimeError('');
    
    if (blockerForm.start_date && blockerForm.end_date) {
      if (blockerForm.start_date > blockerForm.end_date) {
        setTimeError('Start date must be before or equal to end date');
        return;
      }
    }
    
    const isSingleDay = !blockerForm.end_date || blockerForm.start_date === blockerForm.end_date;
    if (isSingleDay && blockerForm.start_time && blockerForm.end_time) {
      if (blockerForm.start_time >= blockerForm.end_time) {
        setTimeError('Start time must be before end time for single day blocks');
        return;
      }
    }
    
    try {
      const data = {
        start_date: blockerForm.start_date,
        end_date: blockerForm.end_date || blockerForm.start_date,
        start_time: blockerForm.start_time || null,
        end_time: blockerForm.end_time || null,
        reason: blockerForm.reason || null,
      };
      
      await availabilityAPI.createBlocker(data);
      await onUpdate();
      setShowBlockerForm(false);
      setBlockerForm({ start_date: '', end_date: '', start_time: '', end_time: '', reason: '' });
    } catch (error) {
      setTimeError(error.response?.data?.detail || 'Failed to create blocker');
    }
  };
  
  const handleDeleteBlocker = async (blockerId) => {
    try {
      await availabilityAPI.deleteBlocker(blockerId);
      await onUpdate();
    } catch (error) {
      alert('Failed to delete blocker');
    }
  };

  return (
    <div className="space-y-10">
      {/* Weekly Schedule */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-serif text-neutral-900">Weekly Schedule</h3>
          {schedule.length === 0 && (
            <button
              onClick={onUpdate}
              className="px-6 py-3 bg-[#B8A188] text-white rounded-xl hover:bg-[#A89178] transition font-medium shadow-md"
            >
              Initialize Schedule
            </button>
          )}
        </div>
        
        <div className="space-y-4">
          {DAYS.map((day) => {
            const daySchedule = getDaySchedule(day.key);
            const isEditing = editingDay === day.key;
            
            if (!daySchedule) {
              return (
                <div 
                  key={day.key}
                  className="bg-white border border-[#E5DDD5] rounded-xl p-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-40">
                        <span className="font-semibold text-neutral-900 text-lg">{day.label}</span>
                      </div>
                      <span className="text-neutral-400">Loading...</span>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <div 
                key={day.key}
                className="bg-white border border-[#E5DDD5] rounded-xl p-6 hover:border-[#B8A188] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-40">
                      <span className="font-semibold text-neutral-900 text-lg">{day.label}</span>
                    </div>
                    
                    {daySchedule.is_available ? (
                      isEditing ? (
                        <div className="flex items-center gap-4">
                          <select
                            defaultValue={formatTime(daySchedule.start_time)}
                            onBlur={(e) => handleTimeChange(daySchedule, 'start_time', e.target.value)}
                            className="px-4 py-3 border border-[#E5DDD5] rounded-lg text-base bg-white"
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                          <span className="text-neutral-500 font-medium">to</span>
                          <select
                            defaultValue={formatTime(daySchedule.end_time)}
                            onBlur={(e) => handleTimeChange(daySchedule, 'end_time', e.target.value)}
                            className="px-4 py-3 border border-[#E5DDD5] rounded-lg text-base bg-white"
                          >
                            {timeOptions.map(time => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setEditingDay(null)}
                            className="text-base text-neutral-900 hover:text-neutral-700 font-medium"
                          >
                            Done
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="text-neutral-700 text-lg">
                            {formatTime(daySchedule.start_time)} - {formatTime(daySchedule.end_time)}
                          </span>
                          <button
                            onClick={() => setEditingDay(day.key)}
                            className="text-base text-neutral-600 hover:text-neutral-900 font-medium"
                          >
                            Edit hours
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-neutral-500 text-lg">Closed</span>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleToggleDay(daySchedule)}
                    className={`px-6 py-3 rounded-xl text-base font-medium transition shadow-sm ${
                      daySchedule.is_available
                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        : 'bg-[#B8A188] text-white hover:bg-[#A89178]'
                    }`}
                  >
                    {daySchedule.is_available ? 'Close' : 'Open'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time Blockers */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-3xl font-serif text-neutral-900">Time Off & Exceptions</h3>
          {!showBlockerForm && (
            <button
              onClick={() => setShowBlockerForm(true)}
              className="px-6 py-3 bg-[#B8A188] text-white rounded-xl hover:bg-[#A89178] transition font-medium shadow-md"
            >
              + Block Time
            </button>
          )}
        </div>

        {showBlockerForm && (
          <div className="bg-[#F5F0EB] p-8 rounded-xl border border-[#E5DDD5] mb-6">
            <h4 className="font-semibold mb-6 text-neutral-900 text-xl">Block Time</h4>
            
            {timeError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm border border-red-200">
                {timeError}
              </div>
            )}
            
            <form onSubmit={handleCreateBlocker} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={blockerForm.start_date}
                    onChange={(e) => setBlockerForm({ ...blockerForm, start_date: e.target.value })}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={blockerForm.end_date}
                    onChange={(e) => setBlockerForm({ ...blockerForm, end_date: e.target.value })}
                    min={blockerForm.start_date || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                  />
                  <p className="text-xs text-neutral-500 mt-2">Leave empty for single day</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Start Time (optional)
                  </label>
                  <select
                    value={blockerForm.start_time}
                    onChange={(e) => {
                      setBlockerForm({ ...blockerForm, start_time: e.target.value });
                      setTimeError('');
                    }}
                    className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                  >
                    <option value="">Select time</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                  <p className="text-xs text-neutral-500 mt-2">Leave both times empty to block all day</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    End Time (optional)
                  </label>
                  <select
                    value={blockerForm.end_time}
                    onChange={(e) => {
                      setBlockerForm({ ...blockerForm, end_time: e.target.value });
                      setTimeError('');
                    }}
                    className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                  >
                    <option value="">Select time</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={blockerForm.reason}
                  onChange={(e) => setBlockerForm({ ...blockerForm, reason: e.target.value })}
                  placeholder="e.g., Vacation, Conference, Personal"
                  className="w-full px-4 py-3 border border-[#E5DDD5] rounded-lg focus:ring-2 focus:ring-[#B8A188] bg-white"
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#B8A188] text-white rounded-lg hover:bg-[#A89178] transition font-medium"
                >
                  {blockerForm.end_date && blockerForm.end_date !== blockerForm.start_date 
                    ? 'Block Date Range' 
                    : 'Block Time'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowBlockerForm(false);
                    setBlockerForm({ start_date: '', end_date: '', start_time: '', end_time: '', reason: '' });
                    setTimeError('');
                  }}
                  className="px-6 py-3 text-neutral-600 hover:text-neutral-900 transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {blockers.length === 0 ? (
          <div className="bg-white rounded-xl p-16 text-center border border-[#E5DDD5]">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-neutral-600 text-lg">No blocked times yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {(() => {
              const grouped = [];
              let currentGroup = null;
              
              const sortedBlockers = [...blockers].sort((a, b) => 
                new Date(a.date) - new Date(b.date)
              );
              
              sortedBlockers.forEach((blocker) => {
                const blockerDate = new Date(blocker.date);
                const isSameConfig = currentGroup && 
                  currentGroup.start_time === blocker.start_time &&
                  currentGroup.end_time === blocker.end_time &&
                  currentGroup.reason === blocker.reason;
                
                const isConsecutive = currentGroup && (() => {
                  const lastDate = new Date(currentGroup.end_date);
                  const daysDiff = Math.round((blockerDate - lastDate) / 86400000);
                  return daysDiff === 1;
                })();
                
                if (isSameConfig && isConsecutive) {
                  currentGroup.end_date = blocker.date;
                  currentGroup.blockers.push(blocker);
                } else {
                  if (currentGroup) grouped.push(currentGroup);
                  currentGroup = {
                    start_date: blocker.date,
                    end_date: blocker.date,
                    start_time: blocker.start_time,
                    end_time: blocker.end_time,
                    reason: blocker.reason,
                    blockers: [blocker]
                  };
                }
              });
              
              if (currentGroup) grouped.push(currentGroup);
              
              return grouped.map((group, idx) => {
                const startDate = new Date(group.start_date);
                const endDate = new Date(group.end_date);
                const isRange = group.start_date !== group.end_date;
                
                return (
                  <div
                    key={idx}
                    className="bg-white border border-[#E5DDD5] rounded-xl p-6 flex justify-between items-center hover:border-[#B8A188] transition-all"
                  >
                    <div>
                      <div className="font-semibold text-neutral-900 mb-2 text-lg">
                        {isRange ? (
                          <>
                            {startDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            {' → '}
                            {endDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            <span className="ml-2 text-sm text-neutral-500">
                              ({group.blockers.length} days)
                            </span>
                          </>
                        ) : (
                          startDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        )}
                      </div>
                      <div className="text-base text-neutral-600">
                        {group.start_time && group.end_time ? (
                          <>
                            {formatTime(group.start_time)} - {formatTime(group.end_time)}
                          </>
                        ) : (
                          'All day'
                        )}
                        {group.reason && (
                          <span className="ml-2 text-neutral-500">• {group.reason}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        const confirmMessage = group.blockers.length === 1 
                          ? 'Delete this blocked time?'
                          : `Delete ${group.blockers.length} blocked days?`;
                        
                        if (confirm(confirmMessage)) {
                          try {
                            await Promise.all(group.blockers.map(b => handleDeleteBlocker(b.id)));
                          } catch (error) {
                            alert('Failed to delete blockers');
                          }
                        }
                      }}
                      className="px-5 py-3 text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:border-red-400 transition font-medium"
                    >
                      Delete
                    </button>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}