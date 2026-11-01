// Shared by the Beitragsgruppen tests and the quality check of the SV proposals.
// DEÜV Anlage 16 (Version 8.01): allowed digits per Personengruppe, in the order KV RV AV PV, for
// Meldezeiträume from 2009 (KV 2 and RV 2, 4, 6 only for earlier periods).
export const ANLAGE_16: Record<string, [string, string, string, string]> = {
  '101': ['01369', '013', '012', '012'],
  '102': ['0139', '01', '01', '012'],
  '103': ['01349', '013', '012', '012'],
  '105': ['013', '01', '01', '012'],
  '106': ['06', '013', '0', '0'],
  '108': ['0349', '01', '0', '012'],
  '109': ['0136', '015', '012', '012'],
  '110': ['0', '0', '0', '0'],
  '119': ['039', '03', '012', '012'],
  '120': ['039', '1', '012', '012'],
  '121': ['013', '01', '01', '012'],
  '122': ['0139', '01', '01', '012'],
  '123': ['0139', '01', '012', '012'],
  '190': ['0', '0', '0', '0'],
};
