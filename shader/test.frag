#version 460

uniform uint time;

out vec4 frag_colour;

void main()
{
    frag_colour = 0.25+vec4(gl_FragCoord.x*0.5/1920.0, 0.0, gl_FragCoord.y*0.5/1080.0, 1.0);

    frag_colour *= 0.5+cos(float(time)/1000.0)*0.5;
}