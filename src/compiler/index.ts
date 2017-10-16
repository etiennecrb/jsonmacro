import * as peg from 'pegjs';

import { grammar } from './grammar';

const parser = peg.generate(grammar);

export const compile = (input: string): any => parser.parse(input);
