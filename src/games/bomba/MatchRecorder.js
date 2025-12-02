export default class MatchRecorder {
  constructor(){ this.attempts = []; }
  recordAttempt(attempt){
    const a = Object.assign({}, attempt);
    a.timestamp = new Date();
    this.attempts.push(a);
  }
  getAttempts(){ return this.attempts.slice(); }
}
