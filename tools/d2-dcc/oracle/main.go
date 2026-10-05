// Command oracle prints, for each DCC path on stdin, one line per direction: path, direction,
// box, frame count and the sha256 of every frame, as decoded by OpenDiablo2's d2dcc.
// ../oracle.ts compares the TypeScript port with it.
package main

import (
	"bufio"
	"crypto/sha256"
	"fmt"
	"os"

	"github.com/OpenDiablo2/OpenDiablo2/d2common/d2fileformats/d2dcc"
)

func main() {
	scanner := bufio.NewScanner(os.Stdin)
	out := bufio.NewWriter(os.Stdout)
	defer out.Flush()

	for scanner.Scan() {
		path := scanner.Text()
		data, err := os.ReadFile(path)
		if err != nil {
			panic(err)
		}

		dcc, err := d2dcc.Load(data)
		if err != nil {
			fmt.Fprintf(out, "%s ERROR %v\n", path, err)
			continue
		}

		for i, dir := range dcc.Directions {
			hash := sha256.New()
			for _, frame := range dir.Frames {
				hash.Write(frame.PixelData)
			}
			fmt.Fprintf(out, "%s %d %d %d %d %d %d %x\n", path, i, dir.Box.Left, dir.Box.Top, dir.Box.Width, dir.Box.Height, len(dir.Frames), hash.Sum(nil))
		}
	}
}
