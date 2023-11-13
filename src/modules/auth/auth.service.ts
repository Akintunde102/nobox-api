import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { generateJWTToken, verifyJWTToken } from '@/utils/jwt';
import { CustomLogger as Logger } from '@/modules/logger/logger.service';
import { throwBadRequest } from '@/utils/exceptions';
import axios from 'axios';
import { generateGoogleOAuthLink } from '@/utils/google-oauth-link';
import {
   GoogleOAuthUserDetails,
   ProcessThirdPartyLogin,
   OAuthThirdPartyName,
   AuthConfDetails,
} from '@/types';
import { generateGithubOAuthLink } from '@/utils/github-oauth-link';
import { v4 } from 'uuid';
import { Request, Response } from 'express';
import {
   GITHUB_CALLBACK_URL,
   GITHUB_CLIENT_AUTH_PATH,
   GITHUB_CLIENT_ID,
   GITHUB_CLIENT_SECRET,
} from '@/config/resources/process-map';
import {
   AuthCheckInput,
   AuthCheckResponse,
} from './types';
import {
   AUTHORIZATION_ERROR,
   USER_NOT_FOUND,
} from '@/utils/constants/error.constants';
import { generateApiKey } from '@/utils/gen';
import { ApiToken, MUser } from '@nobox-org/shared-lib';

@Injectable()
export class AuthService {
   private githubAuthConf: AuthConfDetails & { clientAuthPath: string } = {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
      callBackUrl: GITHUB_CALLBACK_URL,
      clientAuthPath: GITHUB_CLIENT_AUTH_PATH,
   };

   constructor(private userService: UserService, private logger: Logger) { }

   async getEternalToken({ token }: AuthCheckInput): Promise<ApiToken> {
      this.logger.sLog({}, 'authService:getEternalToken');
      const { userDetails } = verifyJWTToken(token) as Record<string, any>;

      const user = await this.userService.getUserDetails({ email: userDetails.email }, {
         throwIfNotFound: true
      });

      if (user.apiToken) {
         return user.apiToken;
      };

      const apiKey = generateApiKey();
      const apiKeyPayload: ApiToken = {
         createdOn: new Date(),
         expired: false,
         token: apiKey,
      };

      await this.userService.update({
         query: { email: user.email },
         update: {
            $set: {
               apiToken: apiKeyPayload
            }
         }
      });

      return apiKeyPayload;
   }

   async authCheck({ token }: AuthCheckInput): Promise<AuthCheckResponse & { userDetails?: MUser }> {
      this.logger.sLog({ token }, 'AuthService:authCheck');
      try {

         const user = await this.userService.getUserDetails({
            "apiToken.token": token
         });

         const result = {
            expired: user.apiToken.expired,
            userNotFound: false,
         };

         return {
            ...result,
            invalid: result.expired || result.userNotFound,
            userDetails: user
         };
      } catch (error) {
         this.logger.sLog({ error }, 'AuthService:authCheck:error');
         const result = {
            expired: error.response.error?.[0] === AUTHORIZATION_ERROR,
            userNotFound:
               error.response.error?.[0] === AUTHORIZATION_ERROR
                  ? null
                  : error.response.error === USER_NOT_FOUND,
         };

         return {
            ...result,
            invalid: result.expired || result.userNotFound,
         };
      }
   }

   async redirectToGoogleOauth(_: Request, res: Response) {
      this.logger.debug('redirect to google oauth');
      const google = {
         clientId: 'client id',
      };
      const uri = generateGoogleOAuthLink({
         clientId: google.clientId,
         redirectUri: `http://localhost:5000/api/google/callback`,
         scope: ['email', 'profile'],
         authType: 'rerequest',
         display: 'popup',
         responseType: 'code',
      });

      this.logger.sLog({ uri }, 'Redirecting to Google login');

      return res.redirect(uri);
   }

   async redirectToGithubOauth(_: Request, res: Response) {
      this.logger.debug('redirecting to github oauth');

      const uri = generateGithubOAuthLink({
         clientId: this.githubAuthConf.clientId,
         redirectUri: this.githubAuthConf.callBackUrl,
         scope: ['user'],
      });

      this.logger.sLog({ uri }, 'Redirecting to Github login');

      return res.redirect(uri);
   }

   private async getGoogleAccessToken({
      code,
      conf,
   }: {
      code: string;
      conf: AuthConfDetails;
   }) {
      try {
         this.logger.debug('getting google access token');

         const params = {
            client_id: conf.clientId,
            client_secret: conf.clientSecret,
            redirect_uri: conf.callBackUrl,
            code,
            grant_type: 'authorization_code',
         };

         const data = await axios({
            url: 'https://oauth2.googleapis.com/token',
            method: 'POST',
            params,
         });

         const {
            data: { access_token: accessToken },
         } = data;

         return accessToken;
      } catch (error) {
         this.logger.warn('Error getting google access token' + error.message);
         throwBadRequest('Something went wrong, please try again');
      }
   }

   private async getGithubAccessToken({
      code,
      conf,
   }: {
      code: string;
      conf: AuthConfDetails;
   }) {
      try {
         this.logger.debug('getting github access token');

         const params = {
            client_id: conf.clientId,
            client_secret: conf.clientSecret,
            redirect_uri: conf.callBackUrl,
            code,
         };

         const { data } = await axios({
            url: 'https://github.com/login/oauth/access_token',
            method: 'POST',
            params,
            headers: {
               Accept: 'application/json',
            },
         });

         if (data.error) {
            this.logger.sLog(
               { data },
               'UserService:getGithubAccessToken:: Error getting github access token',
            );
            throwBadRequest(data.error_description);
         }

         return data.access_token;
      } catch (error) {
         this.logger.sLog(
            { error },
            'UserService::getGithubAccessToken:: Error getting github access token',
         );
         throwBadRequest(error);
      }
   }

   private async getGoogleUserDetails({
      accessToken,
   }: {
      accessToken: string;
   }): Promise<GoogleOAuthUserDetails> {
      const { data: userData } = (await axios({
         url: `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
      })) as { data: GoogleOAuthUserDetails };

      return userData;
   }

   private async getGithubUserDetails({
      accessToken,
   }: {
      accessToken: string;
   }): Promise<any> {
      this.logger.debug('Getting github user details');

      const [{ data: emails }, { data: details }] = await Promise.all([
         axios({
            url: `https://api.github.com/user/emails`,
            headers: {
               Authorization: `Bearer ${accessToken}`,
            },
         }),
         axios({
            url: `https://api.github.com/user`,
            headers: {
               Authorization: `Bearer ${accessToken}`,
            },
         }),
      ]);

      return {
         email: emails[0].email,
         avatar_url: details.avatar_url,
         firstName: details.name || details.login,
      };
   }

   async processGoogleCallback(req: Request, res: Response) {
      try {
         const googleConf = {
            clientId: 'client id',
            clientSecret: 'client secret',
            callBackUrl: `http://localhost:5000/api/google/callback`,
            clientAuthPath: `http://localhost:3000/auth/google`,
         };

         const accessToken = await this.getGoogleAccessToken({
            code: req.query.code as string,
            conf: googleConf,
         });

         const userData = await this.getGoogleUserDetails({
            accessToken: accessToken,
         });

         const user: ProcessThirdPartyLogin = {
            email: userData.email,
            firstName: userData.given_name,
            lastName: userData.family_name || '',
            accessToken,
            avatar_url: userData.picture,
            thirdPartyName: OAuthThirdPartyName.google,
         };

         const { token } = await this.processThirdPartyLogin(user);

         const clientRedirectURI = `${googleConf.clientAuthPath}?token=${token}`;
         this.logger.debug('redirected back to client via google login');
         res.redirect(clientRedirectURI);
      } catch (err) {
         this.logger.warn(err.message);
         throw 'Error processing google callback';
      }
   }

   async processGithubCallback(req: Request, res: Response) {
      this.logger.sLog(
         { githubConf: this.githubAuthConf },
         'UserService::processGithubCallBack',
      );
      try {
         const accessToken = await this.getGithubAccessToken({
            code: req.query.code as string,
            conf: this.githubAuthConf,
         });

         const userData = await this.getGithubUserDetails({
            accessToken: accessToken,
         });

         const user: ProcessThirdPartyLogin = {
            ...userData,
            accessToken,
            thirdPartyName: OAuthThirdPartyName.github,
         };

         const { token } = await this.processThirdPartyLogin(user);

         const clientRedirectURI = `${this.githubAuthConf.clientAuthPath}?token=${token}`;
         this.logger.debug('redirected back to client');
         res.redirect(clientRedirectURI);
      } catch (err) {
         this.logger.sLog(
            err.message,
            'UserService: ProcessGithubCallback:: Error processing github callback',
         );
         res.send('Github Login Failed');
      }
   }

   async processThirdPartyLogin({
      email,
      firstName,
      accessToken,
      lastName,
      avatar_url,
      thirdPartyName,
   }: ProcessThirdPartyLogin): Promise<any> {
      this.logger.sLog(
         { email, firstName, accessToken, avatar_url, thirdPartyName },
         'UserService::processThirdPartyLogin:: processing third party login',
      );

      let userDetails = await this.userService.getUserDetails({ email }, { throwIfNotFound: false });

      if (!userDetails) {
         this.logger.sLog(
            {},
            'UserService::processThirdPartyLogin:: User not found',
         );

         userDetails = await this.userService.register({
            email,
            password: v4(),
            picture: avatar_url,
            firstName,
            lastName,
         });
      }

      const token = generateJWTToken({ details: userDetails });

      return { token };
   }
}
