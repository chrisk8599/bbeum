'use client';
import { useState, useEffect } from 'react';
import { analyticsAPI } from '@/lib/api';

export default function RevenueAnalytics() {
  const [activeView, setActiveView] = useState('daily'); // Changed default from 'summary' to 'daily'
  const [dailyData, setDailyData] = useState(null);
  const [weeklyData, setWeeklyData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [professionalData, setProfessionalData] = useState(null);
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Period selector for Professional and Service tabs - changed default from 'all' to 'today'
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    // Load daily data on mount since it's the default view now
    loadDailyData();
  }, []);

  useEffect(() => {
    if (activeView === 'daily') loadDailyData();
    else if (activeView === 'weekly') loadWeeklyData();
    else if (activeView === 'monthly') loadMonthlyData();
    else if (activeView === 'professional') loadProfessionalData();
    else if (activeView === 'service') loadServiceData();
  }, [activeView, period]);

  const loadDailyData = async () => {
    try {
      setLoading(true);
      // Calculate past 30 days automatically
      const today = new Date();
      const endDate = today.toISOString().split('T')[0];
      const startDate = new Date(today.setDate(today.getDate() - 30)).toISOString().split('T')[0];
      
      const data = await analyticsAPI.getDailyRevenue(startDate, endDate);
      setDailyData(data);
    } catch (error) {
      console.error('Error loading daily data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeeklyData = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getWeeklyRevenue(12);
      setWeeklyData(data);
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      const data = await analyticsAPI.getMonthlyRevenue(12);
      setMonthlyData(data);
    } catch (error) {
      console.error('Error loading monthly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeForPeriod = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let startDate = null;
    let endDate = null;

    switch (period) {
      case 'today':
        startDate = todayStr;
        endDate = todayStr;
        break;
      case 'week':
        // Get Monday of current week
        const monday = new Date(today);
        monday.setDate(today.getDate() - today.getDay() + 1); // Monday
        startDate = monday.toISOString().split('T')[0];
        endDate = todayStr;
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        endDate = todayStr;
        break;
      case 'all':
        startDate = null;
        endDate = null;
        break;
    }

    return { startDate, endDate };
  };

  const loadProfessionalData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRangeForPeriod();
      const data = await analyticsAPI.getRevenueByProfessional(startDate, endDate);
      setProfessionalData(data);
    } catch (error) {
      console.error('Error loading professional data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadServiceData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRangeForPeriod();
      const data = await analyticsAPI.getRevenueByService(startDate, endDate);
      setServiceData(data);
    } catch (error) {
      console.error('Error loading service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'all': return 'All Time';
      default: return 'Today';
    }
  };

  if (loading && !dailyData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* View Tabs - Summary tab removed */}
      <div className="bg-white rounded-xl border-2 border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-200 bg-gradient-beige-light">
          <div className="flex overflow-x-auto">
            {['daily', 'weekly', 'monthly', 'professional', 'service'].map((view) => (
              <button
                key={view}
                onClick={() => setActiveView(view)}
                className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeView === view
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                }`}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Period Selector for Professional & Service tabs */}
          {['professional', 'service'].includes(activeView) && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-3">Time Period</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'today', label: 'Today', icon: '📅' },
                  { value: 'week', label: 'This Week', icon: '📆' },
                  { value: 'month', label: 'This Month', icon: '🗓️' },
                  { value: 'all', label: 'All Time', icon: '♾️' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPeriod(option.value)}
                    className={`px-5 py-2.5 rounded-lg font-medium transition-all ${
                      period === option.value
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-gradient-beige-light text-neutral-700 hover:bg-neutral-200 border-2 border-neutral-200'
                    }`}
                  >
                    <span className="mr-2">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date Range Picker removed from Daily view */}

          {loading && (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading data...</p>
            </div>
          )}

          {/* Daily View */}
          {activeView === 'daily' && !loading && dailyData && (
            <div className="space-y-4">
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-primary-700 font-medium">Period Total</div>
                    <div className="text-2xl font-bold text-primary-700">${dailyData.total_revenue}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary-700 font-medium">Total Bookings</div>
                    <div className="text-2xl font-bold text-primary-700">{dailyData.total_bookings}</div>
                  </div>
                </div>
              </div>

              {dailyData.daily_breakdown.length > 0 ? (
                <div className="space-y-2">
                  {dailyData.daily_breakdown.map((day) => (
                    <div key={day.date} className="flex items-center justify-between p-4 bg-gradient-beige-light rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors">
                      <div>
                        <div className="font-bold text-neutral-900">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-sm text-neutral-600">{day.bookings} bookings</div>
                      </div>
                      <div className="text-xl font-bold text-primary-600">
                        ${day.revenue}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-600">
                  No bookings found for this period
                </div>
              )}
            </div>
          )}

          {/* Weekly View */}
          {activeView === 'weekly' && !loading && weeklyData && (
            <div className="space-y-4">
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-primary-700 font-medium">Period Total</div>
                    <div className="text-2xl font-bold text-primary-700">${weeklyData.total_revenue}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary-700 font-medium">Total Bookings</div>
                    <div className="text-2xl font-bold text-primary-700">{weeklyData.total_bookings}</div>
                  </div>
                </div>
              </div>

              {weeklyData.weekly_breakdown.length > 0 ? (
                <div className="space-y-2">
                  {weeklyData.weekly_breakdown.map((week, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-beige-light rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors">
                      <div>
                        <div className="font-bold text-neutral-900">
                          {new Date(week.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(week.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-sm text-neutral-600">{week.bookings} bookings</div>
                      </div>
                      <div className="text-xl font-bold text-primary-600">
                        ${week.revenue}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-600">
                  No bookings found for this period
                </div>
              )}
            </div>
          )}

          {/* Monthly View */}
          {activeView === 'monthly' && !loading && monthlyData && (
            <div className="space-y-4">
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-primary-700 font-medium">Period Total</div>
                    <div className="text-2xl font-bold text-primary-700">${monthlyData.total_revenue}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary-700 font-medium">Total Bookings</div>
                    <div className="text-2xl font-bold text-primary-700">{monthlyData.total_bookings}</div>
                  </div>
                </div>
              </div>

              {monthlyData.monthly_breakdown.length > 0 ? (
                <div className="space-y-2">
                  {monthlyData.monthly_breakdown.map((month) => (
                    <div key={`${month.year}-${month.month}`} className="flex items-center justify-between p-4 bg-gradient-beige-light rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors">
                      <div>
                        <div className="font-bold text-neutral-900">
                          {month.month_name}
                        </div>
                        <div className="text-sm text-neutral-600">{month.bookings} bookings</div>
                      </div>
                      <div className="text-xl font-bold text-primary-600">
                        ${month.revenue}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-600">
                  No bookings found for this period
                </div>
              )}
            </div>
          )}

          {/* Professional View */}
          {activeView === 'professional' && !loading && professionalData && (
            <div className="space-y-4">
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-primary-700 font-medium">{getPeriodLabel()} Revenue</div>
                    <div className="text-2xl font-bold text-primary-700">${professionalData.total_revenue}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary-700 font-medium">Total Bookings</div>
                    <div className="text-2xl font-bold text-primary-700">{professionalData.total_bookings}</div>
                  </div>
                </div>
              </div>

              {professionalData.professional_breakdown.length > 0 ? (
                <div className="space-y-2">
                  {professionalData.professional_breakdown.map((prof) => (
                    <div key={prof.professional_id} className="flex items-center justify-between p-4 bg-gradient-beige-light rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors">
                      <div className="flex items-center gap-3">
                        {prof.avatar_url ? (
                          <img 
                            src={prof.avatar_url} 
                            alt={prof.professional_name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg">
                            {prof.professional_name ? prof.professional_name.charAt(0) : '?'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-neutral-900 flex items-center gap-2">
                            {prof.professional_name}
                            {prof.is_owner && (
                              <span className="px-2 py-0.5 text-xs bg-primary-600 text-white rounded-full">Owner</span>
                            )}
                          </div>
                          <div className="text-sm text-neutral-600">{prof.bookings} bookings</div>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-primary-600">
                        ${prof.revenue}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-600">
                  No bookings found for {getPeriodLabel().toLowerCase()}
                </div>
              )}
            </div>
          )}

          {/* Service View */}
          {activeView === 'service' && !loading && serviceData && (
            <div className="space-y-4">
              <div className="bg-primary-50 p-4 rounded-lg border border-primary-200 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-primary-700 font-medium">{getPeriodLabel()} Revenue</div>
                    <div className="text-2xl font-bold text-primary-700">${serviceData.total_revenue}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-primary-700 font-medium">Total Bookings</div>
                    <div className="text-2xl font-bold text-primary-700">{serviceData.total_bookings}</div>
                  </div>
                </div>
              </div>

              {serviceData.service_breakdown.length > 0 ? (
                <div className="space-y-2">
                  {serviceData.service_breakdown.map((service) => (
                    <div key={service.service_id} className="flex items-center justify-between p-4 bg-gradient-beige-light rounded-lg border border-neutral-200 hover:border-primary-300 transition-colors">
                      <div>
                        <div className="font-bold text-neutral-900">{service.service_name}</div>
                        <div className="text-sm text-neutral-600">{service.bookings} bookings</div>
                      </div>
                      <div className="text-xl font-bold text-primary-600">
                        ${service.revenue}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-neutral-600">
                  No bookings found for {getPeriodLabel().toLowerCase()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}