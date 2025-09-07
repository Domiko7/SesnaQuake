
export async function travelTimeIris(depth: number, distDeg: number) {
  const url = `https://service.iris.edu/irisws/traveltime/1/query?model=iasp91&phases=S,+P&evdepth=${depth}&noheader=true&traveltimeonly=true&distdeg=${distDeg}`;
  const response = await fetch(url);
  const text = await response.text();
  const waves = text.trim().split(/\s+/).map(Number);
  return waves;
}

travelTimeIris(30, 50).then(waves => {
  console.log(waves);
});

