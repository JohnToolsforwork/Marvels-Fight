/**
 * A local two-player duel. This module owns round timing and scores; the game
 * remains responsible for movement, damage, spawning, health and effects.
 *
 * Callback signatures (all optional):
 *   onReset({ round, wins, countdown: 3 })
 *   onBanner(text, { token, kind, round })
 *   onRoundEnd(winnerIndex, winsCopy, round, { reason, suddenDeath })
 *   onSuddenDeath({ round, remaining: 30, repeated })
 *   onFinish(winnerIndex, winsCopy, { round })
 *
 * Banner tokens increase monotonically and identify one presentation event.
 * Every score array supplied to a callback is a copy. onReset is called once
 * during construction, so it should use its metadata rather than a variable
 * which is still receiving the result of createDuel(). onSuddenDeath should
 * give both players exactly 1 HP and apply the game's sudden-death effects.
 */
export function createDuel({players,onReset,onRoundEnd,onFinish,onSuddenDeath,onBanner}={}) {
  if(!Array.isArray(players)||players.length!==2)throw new TypeError('PvP vereist precies twee spelers.');
  for(let i=0;i<2;i++){
    const p=players[i];
    if(!p||!Number.isFinite(p.hp)||p.hp<0||!Number.isFinite(p.maxHp)||p.maxHp<=0){
      throw new TypeError(`Speler ${i+1} heeft ongeldige hp/maxHp.`);
    }
  }
  for(const [name,callback] of Object.entries({onReset,onRoundEnd,onFinish,onSuddenDeath,onBanner})){
    if(callback!==undefined&&typeof callback!=='function')throw new TypeError(`${name} moet een functie zijn.`);
  }
  const EPS=1e-8,ROUND_SECONDS=90,COUNTDOWN_SECONDS=3,BREAK_SECONDS=3,SUDDEN_SECONDS=30;
  let phase='countdown',round=1,wins=[0,0],remaining=ROUND_SECONDS,countdown=COUNTDOWN_SECONDS;
  let suddenDeath=false,breakRemaining=0,roundWinner=-1,bannerToken=0;

  function banner(text,kind){onBanner?.(text,{token:++bannerToken,kind,round});}
  function resetRound(){
    phase='countdown';countdown=COUNTDOWN_SECONDS;remaining=ROUND_SECONDS;suddenDeath=false;roundWinner=-1;breakRemaining=0;
    onReset?.({round,wins:[...wins],countdown:COUNTDOWN_SECONDS});
    banner(String(COUNTDOWN_SECONDS),'countdown');
  }
  function beginFight(){phase='fight';countdown=0;banner('VECHT','fight');}
  function finishRound(winner,reason){
    if(phase!=='fight')return false;
    phase='roundOver';roundWinner=winner;wins[winner]++;breakRemaining=BREAK_SECONDS;
    onRoundEnd?.(winner,[...wins],round,{reason,suddenDeath});
    banner(`${players[winner].def?.name||`Speler ${winner+1}`} wint de ronde`,'roundWin');
    return true;
  }
  function timeout(){
    // During sudden death both fighters share a one-HP limit. Comparing their
    // original maximum HP here would award an untouched tie to the lighter hero.
    const ratios=players.map(p=>Math.max(0,p.hp)/(suddenDeath?1:p.maxHp));
    if(Math.abs(ratios[0]-ratios[1])>EPS){finishRound(ratios[0]>ratios[1]?0:1,'timeout');return;}
    const repeated=suddenDeath;suddenDeath=true;remaining=SUDDEN_SECONDS;
    onSuddenDeath?.({round,remaining:SUDDEN_SECONDS,repeated});
    banner('Beslissende fase · eerste treffer wint','suddenDeath');
  }

  const duel={
    get phase(){return phase;},
    get round(){return round;},
    get wins(){return [...wins];},
    get remaining(){return remaining;},
    get countdown(){return countdown;},
    get suddenDeath(){return suddenDeath;},
    get canAct(){return phase==='fight';},
    knockout(loserIndex){
      if(loserIndex!==0&&loserIndex!==1)throw new RangeError('Spelerindex moet 0 of 1 zijn.');
      // A second knockout in the same simulation frame cannot change a round.
      return phase==='fight'?finishRound(1-loserIndex,'knockout'):false;
    },
    update(dt){
      if(!Number.isFinite(dt)||dt<0)throw new RangeError('De tijdstap moet een eindig, niet-negatief aantal seconden zijn.');
      let left=dt;
      // Consume each timed boundary in order, including several crossed by one
      // larger frame. No count, round break or win animation is skipped.
      while(left>EPS&&phase!=='finished'){
        if(phase==='countdown'){
          const boundary=Math.max(0,Math.ceil(countdown-EPS)-1);
          const span=Math.max(0,countdown-boundary),step=Math.min(left,span);
          countdown-=step;left-=step;
          if(countdown<=boundary+EPS){
            countdown=boundary;
            if(boundary===0)beginFight();else banner(String(boundary),'countdown');
          }
        }else if(phase==='fight'){
          const step=Math.min(left,remaining);remaining-=step;left-=step;
          if(remaining<=EPS){remaining=0;timeout();}
        }else if(phase==='roundOver'){
          const step=Math.min(left,breakRemaining);breakRemaining-=step;left-=step;
          if(breakRemaining<=EPS){
            breakRemaining=0;
            if(wins[roundWinner]>=2){phase='finished';onFinish?.(roundWinner,[...wins],{round});}
            else{round++;resetRound();}
          }
        }
      }
      return duel;
    }
  };
  resetRound();
  return duel;
}
