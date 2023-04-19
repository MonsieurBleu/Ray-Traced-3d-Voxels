#version 460

layout (location = 0) uniform ivec2 iResolution;
layout (location = 1) uniform float iTime;

out vec4 frag_colour;

void main()
{
    frag_colour = 0.25+vec4(gl_FragCoord.x*0.5/float(iResolution.x), 0.0, gl_FragCoord.y*0.5/float(iResolution.y), 1.0);

    frag_colour *= 0.5+cos(time)*0.5;
}