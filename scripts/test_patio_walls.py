import math
import unittest
from build_patio_walls import build, load, SOURCES

class InventoryTests(unittest.TestCase):
    def test_axes_and_retirement(self):
        rows={r['id']:r for r in build()['records']}
        for source in SOURCES:
            for wall in load('data/'+source)['walls']:
                key=source+':'+wall['id']
                if wall.get('retired'):
                    self.assertNotIn(key,rows)
                    continue
                row=rows[key]
                self.assertEqual(row['points'],wall['points'])
                length=sum(math.dist(a,b) for a,b in zip(wall['points'],wall['points'][1:]))
                self.assertEqual(row['lengthM'],round(length,2))
                self.assertEqual(row['grossFaceM2'],round(length*wall['height'],2))
                self.assertEqual(row['evidence'],wall['evidence'])
    def test_uncertain_boundaries_never_become_quantities(self):
        rows=build()['records']
        self.assertEqual(len(rows),len({r['id'] for r in rows}))
        for row in rows:
            if row['kind'] in ('enclosure','gap','context'):
                self.assertNotIn('lengthM',row)
                self.assertNotIn('grossFaceM2',row)
        self.assertTrue(any('plain_fronts' in r['id'] for r in rows))
        self.assertTrue(any('raised_terraces' in r['id'] for r in rows))
        self.assertEqual(sum(r['kind']=='enclosure' for r in rows),sum(b['floors']==0 and not b.get('notStanding') for b in load('public/map/skeleton.json')['buildings']))

if __name__=='__main__': unittest.main()
