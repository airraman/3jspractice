varying vec3 vertexNormal;

void main(){


    float intensity = pow(.6 - dot(vertexNormal, vec3(0,0,1)), 2.0);


    gl_FragColor = vec4(.3, .6, 1.0, 1.0) * intensity;
}