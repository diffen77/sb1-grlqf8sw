import { supabase } from '../supabase';
import { Draw, Match } from '../../types';
import { handleError } from '../errorHandler';
import { validateApiUrl } from '../validation';

interface ApiResponse {
  draws: Array<{
    productName: string;
    seasonLastDraw: boolean;
    productId: number;
    currentNetSale: string;
    regCloseDescription: string;
    extraInfo: string | null;
    drawNumber: number;
    betIndex: number;
    drawState: string;
    drawStateId: number;
    regBetDisabled: string;
    regOpenTime: string;
    regCloseTime: string;
    cancelCloseTime: string;
    sport: {
      id: number;
      type: number;
      name: string;
    };
    drawComment: string;
    drawEvents: Array<{
      id: string;
      homeTeam: string;
      awayTeam: string;
      startTime: string;
      odds: {
        home: number;
        draw: number;
        away: number;
      };
      statistics?: {
        homeForm?: string;
        awayForm?: string;
        headToHead?: string;
      };
    }>;
  }>;
}

// Generate a deterministic UUID from a numeric ID
function generateMatchUUID(numericId: string | number): string {
  // Ensure numeric ID is a string and pad it to 10 digits
  const paddedId = String(numericId).padStart(10, '0');
  
  // Create a deterministic UUID using the numeric ID
  const segments = [
    paddedId.slice(0, 8),              // Use first 8 digits
    paddedId.slice(-4),                // Use last 4 digits
    '4000',                            // Version 4 UUID identifier
    (parseInt(paddedId) % 4096).toString(16).padStart(4, '0'), // Use modulo for variety
    (parseInt(paddedId) * 7919).toString(16).padStart(12, '0') // Multiply by prime for uniqueness
  ];
  
  return segments.join('-');
}

function isValidApiResponse(data: any): data is ApiResponse {
  try {
    // Check if data has the required structure
    if (!data || typeof data !== 'object') {
      console.error('Invalid API response: not an object');
      return false;
    }
    if (!Array.isArray(data.draws)) {
      console.error('Invalid API response: draws is not an array');
      return false;
    }
    
    if (data.draws.length === 0) {
      console.error('Invalid API response: draws array is empty');
      return false;
    }

    const draw = data.draws[0]; // Get the first draw
    console.log('Validating draw:', {
      hasDrawEvents: !!draw.drawEvents,
      drawEventsLength: draw.drawEvents?.length,
      firstEvent: draw.drawEvents?.[0]
    });

    // Validate draw properties
    if (typeof draw.drawNumber !== 'number') {
      console.error('Invalid API response: drawNumber is not a number');
      return false;
    }
    if (typeof draw.regCloseTime !== 'string') {
      console.error('Invalid API response: regCloseTime is not a string');
      return false;
    }
    
    if (!Array.isArray(draw.drawEvents)) {
      console.error('Invalid API response: drawEvents is not an array');
      return false;
    }

    // Track seen match IDs to prevent duplicates
    const seenMatchIds = new Set<string>();
    
    // Validate each match and ensure no duplicates
    return draw.drawEvents.every((match, index) => {
      if (!match || typeof match !== 'object') {
        console.error('Invalid API response: match is not an object', match);
        return false;
      }

      // Extract match data from the correct structure
      const matchData = match.match || {};
      
      // Extract and normalize match ID
      const rawMatchId = matchData.matchId?.toString() || match.id;
      const matchId = rawMatchId ? generateMatchUUID(rawMatchId) : null;
      
      // Log match ID generation for debugging
      console.log('Generated match ID:', {
        rawMatchId,
        generatedId: matchId
      });
      
      if (!matchId) {
        console.error('Invalid API response: no valid match ID found', match);
        return false;
      }
      
      // Check for duplicates
      if (seenMatchIds.has(matchId)) {
        console.error(`Duplicate match ID found: ${matchId}`, match);
        return false;
      }
      seenMatchIds.add(matchId);
      
      // Use API team names directly
      const homeTeam = match.eventDescription?.split(' - ')?.[0];
      const awayTeam = match.eventDescription?.split(' - ')?.[1];
      
      if (!homeTeam || typeof homeTeam !== 'string') {
        console.error('Invalid API response: no valid home team name', match);
        return false;
      }
      if (!awayTeam || typeof awayTeam !== 'string') {
        console.error('Invalid API response: no valid away team name', match);
        return false;
      }
      
      // Extract match time from either startTime or matchStart
      const matchTime = matchData.matchStart;
      if (!matchTime || typeof matchTime !== 'string') {
        console.error('Invalid API response: no valid match time', match);
        return false;
      }
      
      // Validate odds
      const odds = match.odds || {};
      const homeOdds = parseFloat(odds.one || odds.home || '0');
      const drawOdds = parseFloat(odds.x || odds.draw || '0');
      const awayOdds = parseFloat(odds.two || odds.away || '0');
      
      if (isNaN(homeOdds) || isNaN(drawOdds) || isNaN(awayOdds)) {
        console.error('Invalid API response: match.odds is not an object', match);
        return false;
      }

      return true;
    });
  } catch (err) {
    console.error('API response validation error:', err);
    return false;
  }
}

export async function getCurrentDraw(apiUrl: string): Promise<Draw> {
  try {
    // Validate API URL
    validateApiUrl(apiUrl);

    const response = await fetch(apiUrl);
    if (!response.ok) {
      let errorMessage = `API responded with status ${response.status}`;
      let responseText = '';
      try {
        responseText = await response.text();
        try {
          const errorData = JSON.parse(responseText);
          errorMessage += `: ${errorData.message || JSON.stringify(errorData)}`;
        } catch {
          errorMessage += `: ${responseText}`;
        }
      } catch {
        // If we can't parse the error response, use the status text
        errorMessage += `: ${response.statusText}`;
      }
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      throw new Error(errorMessage);
    }

    let data;
    try {
      const responseText = await response.text();
      console.log('Raw API Response:', responseText.slice(0, 1000)); // Log first 1000 chars
      data = JSON.parse(responseText);
    } catch (err) {
      console.error('Failed to parse API response:', err);
      throw new Error('Invalid JSON response from API');
    }
    
    if (!isValidApiResponse(data)) {
      console.error('API Response Validation Failed:', {
        hasDraws: !!data?.draws,
        drawsLength: data?.draws?.length,
        firstDraw: data?.draws?.[0]
      });
      throw new Error('Invalid API response format. Expected a draw object with matches.');
    }

    const currentDraw = data.draws[0];
    const drawDate = new Date(currentDraw.regCloseTime);
    
    // Extract week number and year from regCloseDescription
    // Format: "Stryktipset v 5, stänger 2025-02-01 15:59"
    const weekMatch = currentDraw.regCloseDescription.match(/v (\d+)/);
    const weekNumber = weekMatch ? parseInt(weekMatch[1]) : drawDate.getWeek();
    const year = drawDate.getFullYear();

    // Transform to our internal Draw type
    const draw: Draw = {
      id: crypto.randomUUID(), // Generate a new ID for new draws
      weekNumber,
      year,
      drawDate: currentDraw.regCloseTime,
      status: currentDraw.drawState.toLowerCase(),
      matches: currentDraw.drawEvents.map((match, index) => {
        const matchData = match.match || {};
        const [homeTeam, awayTeam] = match.eventDescription?.split(' - ') || [];
        const odds = match.odds || {};
        const rawMatchId = matchData.matchId?.toString();
        const eventNumber = match.eventNumber || index + 1;
        
        // Generate a stable UUID for the match
        if (!rawMatchId) {
          console.error('No match ID found for match:', match);
          throw new Error('Match ID is required');
        }
        
        const matchUUID = generateMatchUUID(rawMatchId);
        
        // Log match ID generation for debugging
        console.log('Match mapping:', {
          eventNumber: match.eventNumber,
          rawMatchId,
          generatedId: matchUUID,
          teams: `${homeTeam} vs ${awayTeam}`
        });

        // Extract or generate medium names
        const homeMediumName = homeTeam?.slice(0, 8);
        const awayMediumName = awayTeam?.slice(0, 8);
        
        if (!homeTeam || !awayTeam) {
          console.error('Missing team names from API:', match);
          throw new Error('Team names are required from API');
        }

        return {
          id: matchUUID,
          eventNumber: match.eventNumber || index + 1,
          homeTeam: homeTeam,
          home_team_medium_name: homeMediumName,
          awayTeam: awayTeam,
          away_team_medium_name: awayMediumName,
          datetime: matchData.matchStart,
          match_status: matchData.status || 'NotStarted',
          match_status_id: matchData.statusId || 0,
          sport_event_status: matchData.sportEventStatus || 'NotStarted',
          odds: {
            home: parseFloat(odds.one || '0'),
            draw: parseFloat(odds.x || '0'),
            away: parseFloat(odds.two || '0')
          },
          statistics: match.statistics ? {
            homeForm: match.statistics.homeForm || '',
            awayForm: match.statistics.awayForm || '',
            headToHead: match.statistics.headToHead || ''
          } : undefined
        };
      })
    };

    return draw;
  } catch (error) {
    handleError(error, { context: 'getCurrentDraw', apiUrl });
    throw error;
  }
}

export async function syncDraw(draw: Draw) {
  try {
    // First check if draw exists to determine if we need to create or update
    const { data: existingDraw, error: checkError } = await supabase
      .from('draws')
      .select('id')
      .eq('week_number', draw.weekNumber)
      .eq('year', draw.year)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingDraw) {
      // Update existing draw with new information
      const { error: updateError } = await supabase
        .from('draws')
        .update({
          draw_date: draw.drawDate,
          status: draw.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingDraw.id);

      if (updateError) throw updateError;

      // Get all existing matches for this draw
      const { data: existingMatches, error: fetchError } = await supabase
        .from('matches')
        .select('*')
        .eq('draw_id', existingDraw.id);

      if (fetchError) throw fetchError;

      // Create a map of existing matches by ID for quick lookup and comparison
      const existingMatchesMap = new Map(
        (existingMatches || []).map(match => [match.id, match])
      );

      // Track statistics
      let matchesUpdated = 0;
      let matchesSkipped = 0;

      for (const match of draw.matches) {
        const existingMatch = existingMatchesMap.get(match.id);
        
        if (existingMatch) {
          // Compare fields to see if an update is needed
          const needsUpdate = 
            existingMatch.home_team !== match.homeTeam ||
            existingMatch.away_team !== match.awayTeam ||
            existingMatch.home_team_medium_name !== match.home_team_medium_name ||
            existingMatch.away_team_medium_name !== match.away_team_medium_name ||
            existingMatch.event_number !== match.eventNumber ||
            existingMatch.match_time !== match.datetime ||
            existingMatch.home_odds !== match.odds.home ||
            existingMatch.draw_odds !== match.odds.draw ||
            existingMatch.away_odds !== match.odds.away ||
            existingMatch.home_form !== match.statistics?.homeForm ||
            existingMatch.away_form !== match.statistics?.awayForm ||
            existingMatch.head_to_head !== match.statistics?.headToHead ||
            existingMatch.match_status !== match.match_status ||
            existingMatch.match_status_id !== match.match_status_id ||
            existingMatch.sport_event_status !== match.sport_event_status;

          if (needsUpdate) {
            const { error: updateError } = await supabase
              .from('matches')
              .update({
                home_team: match.homeTeam,
                away_team: match.awayTeam,
                event_number: match.eventNumber || index + 1,
                home_team_medium_name: match.home_team_medium_name,
                away_team_medium_name: match.away_team_medium_name,
                match_time: match.datetime,
                home_odds: match.odds.home,
                draw_odds: match.odds.draw,
                away_odds: match.odds.away,
                home_form: match.statistics?.homeForm,
                away_form: match.statistics?.awayForm,
                head_to_head: match.statistics?.headToHead,
                match_status: match.match_status,
                match_status_id: match.match_status_id,
                sport_event_status: match.sport_event_status,
                updated_at: new Date().toISOString()
              })
              .eq('id', match.id)
              .eq('draw_id', existingDraw.id);

            if (updateError) throw updateError;
            matchesUpdated++;
          } else {
            matchesSkipped++;
          }
        } else {
          // Double check that the match doesn't exist with a different ID
          const { data: matchByTeams, error: matchCheckError } = await supabase
            .from('matches')
            .select('*')
            .eq('draw_id', existingDraw.id)
            .eq('home_team', match.homeTeam)
            .eq('away_team', match.awayTeam)
            .eq('match_time', match.datetime);

          if (matchCheckError) {
            throw matchCheckError;
          }

          // Check if we found any matches
          if (!matchByTeams || matchByTeams.length === 0) {
            // Only insert if the match truly doesn't exist
            console.log('Inserting new match:', {
              id: match.id,
              homeTeam: match.homeTeam,
              awayTeam: match.awayTeam,
              matchTime: match.datetime
            });

            const { error: insertError } = await supabase
              .from('matches')
              .insert({
                id: match.id,
                draw_id: existingDraw.id,
                home_team: match.homeTeam,
                home_team_medium_name: match.home_team_medium_name,
                away_team: match.awayTeam,
                away_team_medium_name: match.away_team_medium_name,
                event_number: match.eventNumber || index + 1,
                match_time: match.datetime,
                home_odds: match.odds.home,
                draw_odds: match.odds.draw,
                away_odds: match.odds.away,
                home_form: match.statistics?.homeForm,
                away_form: match.statistics?.awayForm,
                head_to_head: match.statistics?.headToHead,
                match_status: match.match_status,
                match_status_id: match.match_status_id,
                sport_event_status: match.sport_event_status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });

            if (insertError) throw insertError;
            matchesUpdated++;
          } else {
            console.log('Match already exists:', {
              existingMatch: matchByTeams[0],
              newMatch: match
            });
            matchesSkipped++;
          }
        }
      }

      // Check for matches that exist in DB but not in the new data
      const { data: allMatches, error: allMatchesError } = await supabase
        .from('matches')
        .select('id, match_status')
        .eq('draw_id', existingDraw.id);

      if (allMatchesError) throw allMatchesError;

      const newMatchIds = new Set(draw.matches.map(m => m.id));
      for (const existingMatch of allMatches || []) {
        if (!newMatchIds.has(existingMatch.id)) {
          // Update status of removed matches if they're not already finished
          if (!['finished', 'cancelled'].includes(existingMatch.match_status?.toLowerCase() || '')) {
            const { error: statusError } = await supabase
              .from('matches')
              .update({
                match_status: 'Cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', existingMatch.id);

            if (statusError) throw statusError;
            matchesSkipped++;
          }
        }
      }

      return {
        status: 'exists' as const,
        drawId: existingDraw.id,
        matchesAdded: 0,
        matchesUpdated,
        matchesSkipped
      };
    } else {
      // Create new draw with all matches
      const result = await createNewDraw(draw);
      return {
        ...result,
        matchesSkipped: 0
      };
    }
  } catch (error) {
    handleError(error, { context: 'syncDraw', weekNumber: draw.weekNumber, year: draw.year });
    throw error;
  }
}

async function createNewDraw(draw: Draw) {
  try {
    // Create new draw
    const { data: newDraw, error: drawError } = await supabase
      .from('draws')
      .insert({
        id: draw.id,
        week_number: draw.weekNumber,
        year: draw.year,
        draw_date: draw.drawDate,
        status: 'active'
      })
      .select()
      .single();

    if (drawError) throw drawError;

    // Insert all matches
    let matchesAdded = 0;
    for (const match of draw.matches) {
      const { error: matchError } = await supabase
        .from('matches')
        .insert({
          id: match.id,
          draw_id: newDraw.id,
          home_team: match.homeTeam,
          away_team: match.awayTeam,
          match_time: match.datetime,
          home_odds: match.odds.home,
          draw_odds: match.odds.draw,
          away_odds: match.odds.away,
          home_form: match.statistics?.homeForm,
          away_form: match.statistics?.awayForm,
          head_to_head: match.statistics?.headToHead,
          match_status: match.match_status,
          match_status_id: match.match_status_id,
          sport_event_status: match.sport_event_status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (matchError) throw matchError;
      matchesAdded++;
    }

    return {
      status: 'created' as const,
      drawId: newDraw.id,
      matchesAdded,
      matchesUpdated: 0
    };
  } catch (error) {
    handleError(error, { context: 'createNewDraw', weekNumber: draw.weekNumber, year: draw.year });
    throw error;
  }
}

// Helper function to get week number
declare global {
  interface Date {
    getWeek(): number;
  }
}

Date.prototype.getWeek = function(): number {
  const date = new Date(this.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}