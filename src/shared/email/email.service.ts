import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../auth/auth.user.entity';

@Injectable()
export class EmailService {

    constructor() {}

    sendVerificationEmail() {
        const clientId = '476966906322-vjuo7ibg0h1b5te1v30pce6td20nc6ja.apps.googleusercontent.com';
        const clientSecret = 'qevlaJiA9z1LsD1PbQzRZK8t';
        const refreshToken = '1//04GeZA-nwbDD9CgYIARAAGAQSNwF-L9Irfzz2YaEeJctP-sIqTFkHfPirB2Vhai8W0vfz8lbdH0ooLuqhQU8kwQybsgmVWTKP_M4';

        const { google } = require('googleapis');
        const OAuth2 = google.auth.OAuth2;
        const oauth2Client = new OAuth2(
            clientId,
            clientSecret,
            'https://developers.google.com/oauthplayground',
        );
        oauth2Client.setCredentials({
             refresh_token: refreshToken,
        });
        const accessToken = oauth2Client.getAccessToken();
        let nodemailer = require('nodemailer');
        const smtpTransport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
            type: 'OAuth2',
            user: 'plexafitz@gmail.com',
            clientId,
            clientSecret,
            refreshToken,
            accessToken,
        }});

        const mailOptions = {
            from: 'plexafitz@gmail.com',
            to: 'pzhou07920@gmail.com',
            subject: 'Test Subject',
            html: '<p>Your html here</p>',
        };
        smtpTransport.sendMail(mailOptions, function(err, info) {
            if (err)
              console.log(err);
            else
              console.log(info);
        });
    }
}
