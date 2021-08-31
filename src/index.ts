import { debug } from 'debug';
import { lookup } from 'geoip-lite';
import { createHash } from 'crypto';
import { Request as ExpressRequest, Response, NextFunction, RequestHandler } from 'express';

const log = {
    config: debug('unique-session:config'),
    info: debug('unique-session:info'),
};

declare interface ExtendedRequest {
    session: { destroy: () => void } & Record<string, string>;
    headers: Record<string, string>;
}

type ExpressMiddleware = (request?: Request, response?: Response, next?: NextFunction) => void;

/**
 * global options for the unique-session package
 */
export interface Options {
    /**
     * determine which fields to include within the generated hash
     *
     * note: this values are taken from the headers only
     *
     * @default ['accept', 'accept-language', 'user-agent']
     */
    hashFields?: string[];
    /**
     * specify the path of the end-user IPv4 address
     * the default value is aimed for applications under common proxy (nginx), otherwise,
     * you can use any other location from the request, i.e 'socket.remoteAddress'
     *
     * note: the target path max depth is 2, can't get any deeper (won't work - socket.client.ip)
     *
     * @default 'headers.x-forwarded-for'
     */
    ipField?: string;
    /**
     * the target path for redirect in case of malicious activity detection, and after the session is destroyed
     *
     * @default '/'
     */
    redirectTo?: string;
}

declare type Request = ExtendedRequest & ExpressRequest & Record<string, string>;

export function uniqueSession(options: Options = {}): ExpressMiddleware {
    const UNIQUE_SESSION_KEY = 'unique-session';
    let hashFields = options.hashFields || ['accept', 'accept-language', 'user-agent'];
    let ipField = options.ipField || 'headers.x-forwarded-for';
    let redirectTo = options.redirectTo || '/';

    log.config(`loaded configurations:`);
    log.config(`hashFields: ${hashFields}`);
    log.config(`ipField: ${ipField}`);
    log.config(`redirectTo: ${redirectTo}`);

    function calculateHash(payload: string): string {
        return createHash('md5').update(payload).digest('hex');
    }

    function getRequestValueFromPathString(request: Request, path: string): string {
        const [requestPath, pathTarget]: any[] = path.split('.');

        return request[requestPath][pathTarget];
    }

    function generateCookieSign(request: Request): string {
        const headerFields = hashFields.map((field: string) => request.headers[field]);

        const countryByIP = lookup(getRequestValueFromPathString(request, ipField));

        const rawHashString = [...headerFields, countryByIP].join('');
        log.info(`rawHashString: ${rawHashString}`);

        return calculateHash(rawHashString);
    }

    return function (request: Request, response: Response, next: NextFunction) {
        const cookieSign = generateCookieSign(request);
        log.info(`cookieSign: ${cookieSign}`);

        if (request.session.hasOwnProperty(UNIQUE_SESSION_KEY)) {
            if (cookieSign === request.session[UNIQUE_SESSION_KEY]) {
                return next();
            }

            log.info(`found malicious activity, destroying session`);
            request.session.destroy();

            return response.redirect(redirectTo);
        } else {
            request.session[UNIQUE_SESSION_KEY] = cookieSign;
        }

        return next();
    };
}

export default uniqueSession;
module.exports = uniqueSession;
module.exports.default = uniqueSession;
