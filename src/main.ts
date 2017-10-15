import * as peg from 'pegjs';

import { grammar } from './grammar';

const parser = peg.generate(grammar);

export const parse = (input: string): any => parser.parse(input);
