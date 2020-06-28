function PerlinNoise1D(fSeed, nOctaves, fBias) {
	let nCount = fSeed.size();
	let fOutput = [];
	for (let x = 0; x<nCount; x++) {
		let fNoise = 0;
		let fScaleAcc = 0;
		let fScale = 1;

		for (let o = 0; o<nOctaves; o++) {
			let nPitch = nCount >> o;
			let nSample1 = (x/nPitch)*nPitch;
			let nSample2 = (nSample1+nPitch)%nCount;
			let fBlend = (double)(x-nSample1)/(double)nPitch;
			let fSample = (1-fBlend)*fSeed[nSample1]+fBlend*fSeed[nSample2];
			fScaleAcc += fScale;
			fNoise += fSample*fScale;
			fScale = fScale/fBias;
		}
		fOutput[x] = fNoise/fScaleAcc;
	}
	return fOutput;
}